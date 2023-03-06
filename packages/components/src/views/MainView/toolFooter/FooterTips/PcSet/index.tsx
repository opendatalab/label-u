import { Col, Row, Slider, Input, message as Message, Popover } from 'antd/es';
import { connect } from 'react-redux';
import React, { FC, useContext, useMemo, useState } from 'react';

import { LabelUContext } from '@/store/ctx';
import { PointCloudContext } from '@/components/pointCloudView/PointCloudContext';
import { useTranslation } from 'react-i18next';
import Regex from '@/constant/regex';
import closeIcon from '@/assets/common/close.svg';
import notice from '@/assets/common/notice.svg';
import { PcZRange } from '@label-u/annotation';

interface Iprops {
  updatePopoverStatus: () => void;
}

const PcSet: FC<Iprops> = ({ updatePopoverStatus }) => {
  const { t } = useTranslation();
  const pCtx = useContext(PointCloudContext);

  const [radiusInComponent, setRadiusInComponent] = useState<string>(pCtx.radiuses);
  const updateRadis = () => {
    if (Regex.RadiusesRegexRule.exec(radiusInComponent)) {
      pCtx.setRadiuses(radiusInComponent);
      return;
    }
    Message.error('支持输入多个范围半径，以分号分割。如“6；10；16”');
  };

  const imgAttributeSliderItems = useMemo(() => {
    return [
      {
        name: 'pointSize',
        min: 0,
        max: 10,
        step: 0.1,
        range: false,
        marks: {
          [pCtx.pointSize]: pCtx.pointSize,
        },
        value: pCtx.pointSize,
        onChange: (v: number) => {
          pCtx.setPointSize(v);
        },
      },
      {
        name: 'rangeHeight',
        nameRight: () => {
          pCtx.setZrange(PcZRange as [number, number]);
        },
        min: -10,
        max: 30,
        step: 1,
        range: true,
        marks: {
          [pCtx.zRange[0]]: pCtx.zRange[0],
          [pCtx.zRange[1]]: pCtx.zRange[1],
        },
        value: pCtx.zRange,
        onChange: (v: [number, number]) => {
          pCtx.setZrange(v);
        },
      },
    ];
  }, [pCtx.pointSize, pCtx.zRange]);

  return (
    <div id='popover-with-slider'>
      <Row style={{ marginBottom: '19px' }}>
        <Col span={22}>
          <span style={{ fontSize: '18px', fontWeight: 400, height: '26px', lineHeight: '26px' }}>
            点云设置
          </span>
        </Col>
        <Col span={2}>
          <img
            onClick={(e) => {
              e.stopPropagation();
              updatePopoverStatus();
            }}
            src={closeIcon}
          />
        </Col>
      </Row>
      <div className='pcSettingItem'>
        <Row className='tools' style={{ padding: '0px 0' }}>
          <Col span={24}>
            <div className='singleTool'>
              <span className='toolName'>{t('labelRedius')}</span>
              <Popover
                id='pcSettingPopover'
                placement='right'
                content={
                  <>
                    <p>支持输入多个范围半径，以</p>
                    <p>分号分割。如“6；10；16”</p>
                  </>
                }
                trigger='hover'
              >
                <img className='noticeImg' src={notice} />
              </Popover>
            </div>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Input
              value={radiusInComponent}
              placeholder='请输入数字'
              onBlur={() => {
                updateRadis();
              }}
              onChange={(e) => {
                setRadiusInComponent(e.target.value);
              }}
            />
          </Col>
        </Row>
      </div>

      {imgAttributeSliderItems.map((info: any, index: number) => (
        <div className='pcSettingItem' key={`option_${index}`}>
          <Row className='tools' style={{ padding: '0px 0' }}>
            <Col span={24}>
              <span className='singleTool'>
                <span className='toolName'>
                  {t(info.name)}
                  {info.nameRight ? (
                    <span
                      className='resetAction'
                      onClick={(e) => {
                        e.stopPropagation();
                        info.nameRight();
                      }}
                    >
                      {t('reset')}
                    </span>
                  ) : (
                    ''
                  )}
                </span>
              </span>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Slider
                key={`${info.value[0]}:${info.value[1]}`}
                range={info.range}
                min={info.min}
                max={info.max}
                step={info.step}
                marks={info.marks}
                defaultValue={info.value}
                onAfterChange={info.onChange}
              />
            </Col>
          </Row>
        </div>
      ))}
    </div>
  );
};

export default connect(null, null, null, { context: LabelUContext })(PcSet);
