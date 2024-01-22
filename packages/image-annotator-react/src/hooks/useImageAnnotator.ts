import type { AnnotatorOptions } from '@labelu/image';
import { Annotator } from '@labelu/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

export type ImageAnnotatorOptions = Omit<AnnotatorOptions, 'container'>;

export const useImageAnnotator = (containerRef: React.RefObject<HTMLDivElement>, options: ImageAnnotatorOptions) => {
  const [engine, setAnnotationEngine] = useState<Annotator | null>(null);
  const [optionsState, setOptionsState] = useState<ImageAnnotatorOptions>(options);
  const ignoredFirstRun = useRef<boolean>(true);

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0) {
        return;
      }

      // 忽略第一次运行
      if (ignoredFirstRun.current) {
        ignoredFirstRun.current = false;

        return;
      }

      const height = entries[0].contentRect.height;
      const width = entries[0].contentRect.width;

      engine?.resize(width, height);

      // 需要加载图片后才能居中，否则标注坐标计算会有误差
      if (engine?.backgroundRenderer?.image) {
        engine?.center();
      }
    });

    resizeObserver.observe(containerRef.current as HTMLElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, engine]);

  useEffect(() => {
    if (JSON.stringify(options) === JSON.stringify(optionsState)) {
      return;
    }

    setOptionsState(options);
  }, [options, optionsState]);

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }

    setAnnotationEngine((pre) => {
      pre?.destroy();

      return new Annotator({
        ...(options || {}),
        container: containerRef.current!,
        width: containerRef.current!.clientWidth,
        height: containerRef.current!.clientHeight,
      });
    });

    return () => {
      setAnnotationEngine((pre) => {
        pre?.destroy();
        return null;
      });
    };
  }, [optionsState, containerRef, options]);

  return engine;
};
