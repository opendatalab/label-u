import type { OneTag } from '@label-u/annotation';
import type { BasicConfig } from '@label-u/components';
import { Button, Dropdown, Form, Menu, Select, Switch, Tabs } from 'antd';
import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash-es';
import { PlusOutlined } from '@ant-design/icons';

import type { ToolsConfigState } from '@/types/toolConfig';
import { validateTools } from '@/utils/tool/common';

import { toolnames, types, toolnameT, toolnameC } from './constants';
import FormEngine from './formEngine';
import CommonFormItem from '../components/commonFormItems';
import { LoadInitConfig } from '../configTemplate/config';
import styles from './index.module.scss';

const { Option } = Select;

const noCommonConfigTools = ['tagTool', 'textTool'];

// instead of useState
let activeTabKey = '1';

function setActiveTabKey(value: string) {
  activeTabKey = value;
}

interface IProps {
  config: ToolsConfigState;
  updateConfig: (field: string) => (value: any) => void;
}

const FormConfig: FC<IProps> = ({ config, updateConfig }) => {
  const { tools = [], tagList = [], attribute = [], textConfig = [], commonAttributeConfigurable } = config || {};
  const children = [];
  const [media, setMedia] = useState<string>('图片');
  const [selectTools, setSelectTools] = useState<string[]>([]);
  const [isConfigLoad, setIsConfigLoad] = useState<boolean>(true);

  const updateTools = useMemo(() => updateConfig('tools'), [updateConfig]);
  const updateTagList = useMemo(() => updateConfig('tagList'), [updateConfig]);
  const updateTextConfig = useMemo(() => updateConfig('textConfig'), [updateConfig]);
  const updateAttribute = useMemo(() => updateConfig('attribute'), [updateConfig]);
  const updateCommonAttributeConfigurable = useMemo(() => updateConfig('commonAttributeConfigurable'), [updateConfig]);

  for (let i = 0; i < types.length; i++) {
    children.push(<Option key={types[i]}>{types[i]}</Option>);
  }
  const [force, forceSet] = useState(0);

  const updateSelectTools = useCallback(
    (toolname: string) => {
      const tmp = selectTools;
      if (tmp.indexOf(toolname) >= 0) {
        tmp.splice(tmp.indexOf(toolname), 1);
      } else {
        tmp.push(toolname);
      }
      setSelectTools(tmp);
    },
    [selectTools],
  );

  const loadInitConfig = useCallback(
    async (toolname: string, _tools: BasicConfig[]) => {
      setIsConfigLoad(false);
      await new Promise(async (resolve) => {
        if (toolname) {
          const defaultConfig = (await LoadInitConfig(toolname)) as any;
          const keys = Object.keys(defaultConfig);

          for (const key of keys) {
            if (key === 'tools') {
              updateConfig(key)([..._tools].concat(defaultConfig[key]));
            } else if (_.chain(config).get(key).size().value() === 0) {
              updateConfig(key)(defaultConfig[key]);
            }
          }
          resolve(defaultConfig);
        }
      });
      setIsConfigLoad(true);
    },
    [config, updateConfig],
  );

  const toolMenuItems = useMemo(() => {
    const _items = [];
    for (let i = 0; i < toolnames.length; i++) {
      if (selectTools.indexOf(toolnameT[toolnames[i]]) < 0) {
        _items.push({
          key: toolnameT[toolnames[i]],
          label: (
            <div
              onClick={(e) => {
                updateSelectTools(toolnameT[toolnames[i]]);
                loadInitConfig(toolnameT[toolnames[i]], tools);
                e.stopPropagation();
              }}
              style={{ paddingTop: 5, paddingBottom: 5, paddingLeft: 12 }}
            >
              <span>{toolnames[i]}</span>
            </div>
          ),
        });
      }
    }
    return _items;
  }, [loadInitConfig, selectTools, tools, updateSelectTools]);

  // 删除工具后，selectTools中的工具也要更新
  useEffect(() => {
    const toolNames = _.map(tools, 'tool');
    if (_.isEmpty(tools) || _.isEqual(toolNames, selectTools)) {
      return;
    }

    setSelectTools(toolNames);
  }, [selectTools, tagList?.length, textConfig?.length, tools]);

  const handleChange = (e: React.SetStateAction<string>) => {
    setMedia(e);
  };

  const updateCombineToolsConfig = (_tools: BasicConfig[], toolConfig: Record<string, unknown>, toolname: string) => {
    const newTools = _tools.reduce((res, item) => {
      if (item.tool === toolname || toolname === 'commonForm') {
        const copyItem = { ...item };
        const newConfig = {
          ...copyItem.config,
          ...toolConfig,
        };
        copyItem.config = newConfig;
        res.push(copyItem);
      } else {
        res.push(item);
      }
      return res;
    }, [] as BasicConfig[]);
    updateTools(newTools);
  };

  const actUpdateToolsConfig = (name: string, info: any) => {
    if (name && Object.keys(toolnameC).indexOf(name) >= 0) {
      if (name === 'tagTool') {
        updateTagList(info.values.tagList as OneTag[]);
      } else if (name === 'textTool') {
        updateTextConfig(info.values.textConfig);
      } else {
        updateCombineToolsConfig(tools, info.values, name);
      }
    }
    if (name === 'commonForm') {
      if (info.values.attribute !== undefined) {
        updateAttribute(info.values.attribute);
      }

      updateCommonAttributeConfigurable(info.values.commonAttributeConfigurable);
      let commonToolConfig = {};
      if (info.values.drawOutsideTarget !== undefined) {
        commonToolConfig = Object.assign(commonToolConfig, { drawOutsideTarget: info.values.drawOutsideTarget });
      }
      if (info.values.textConfigurableContext !== undefined) {
        commonToolConfig = Object.assign(commonToolConfig, info.values.textConfigurableContext);
      }
      updateCombineToolsConfig(tools, commonToolConfig, name);
    }
  };
  return (
    <Form labelCol={{ span: 3 }} wrapperCol={{ span: 21 }} colon={false} className={styles.formConfig}>
      <Form.Item label="标注类型">
        <Select size="middle" value={media} onChange={handleChange} listItemHeight={10} listHeight={250}>
          {children}
        </Select>
      </Form.Item>
      <Form.Item label="标注工具">
        <Dropdown overlay={<Menu items={toolMenuItems} />} placement="bottomLeft" trigger={['click']}>
          <Button type="primary" ghost icon={<PlusOutlined />}>
            新增工具
          </Button>
        </Dropdown>
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 3 }}>
        {selectTools && selectTools.length > 0 && validateTools(tools) && (
          <div className="formTabBox">
            <Tabs
              type="card"
              size="small"
              activeKey={String(Math.min(Number(activeTabKey), selectTools.length))}
              onChange={(e) => {
                setActiveTabKey(e);
                forceSet(new Date().getTime());
              }}
              items={selectTools.map((tool, i) => {
                const id = String(i + 1);
                // 配置初始化
                let initC = {} as BasicConfig;
                let configArr = [];
                configArr = tools.filter((item: any) => {
                  return item.tool === tool;
                });
                initC = configArr[0];

                return {
                  //@ts-ignore
                  label: `${toolnameC[tool]}`,
                  key: id,
                  children: (
                    <div className="toolConfigPane">
                      <Form.Provider
                        onFormFinish={(name, info) => {
                          if (Object.keys(info.forms).length > 0) {
                            // todo 统一处理表单 和  标注工具之间联动
                            actUpdateToolsConfig(name, info);
                          }
                        }}
                      >
                        {
                          <FormEngine
                            toolName={tool}
                            toolConfig={initC || {}}
                            {...{
                              updateTagList,
                              updateTextConfig,
                              updateTools,
                            }}
                            config={config}
                          />
                        }
                      </Form.Provider>
                    </div>
                  ),
                };
              })}
            />
          </div>
        )}
      </Form.Item>
      <Form.Item valuePropName="checked" label="画布外标注" name="drawOutsideTarget">
        <Switch />
      </Form.Item>

      <Form.Item
        valuePropName="checked"
        label={<span className="formTitle">通用标签</span>}
        name="commonAttributeConfigurable"
      >
        <Switch />
      </Form.Item>
    </Form>
  );
};

export default React.memo(FormConfig);
