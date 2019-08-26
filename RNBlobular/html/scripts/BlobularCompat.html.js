const getSvg = () => document
  .getElementsByTagName('svg')[0];

window.addEventListener(
  'load',
  () => {
    const paths = {};
    const svg = getSvg();
    const b = new Blobular(
      {
        deleteBlob(withId) {
          const path = paths[withId];
          path
            .parentNode
            .removeChild(
              path,
            );
        },
        updateBlob(withId, withTransform, withRotation, withPath, withMode) {
          const path = paths[withId];
          if (withMode === 'join') {
            path
              .setAttributeNS(
                null,
                'class',
                'blob joining',
              );
          }
          path
            .setAttributeNS(
              null,
              'transform',
              (!!withRotation) ? `translate(${withTransform[0]}, ${withTransform[1]}) rotate(${withRotation}, 0, 0)` : `translate(${withTransform[0]}, ${withTransform[1]})`,
            );
          path
            .setAttribute(
              'd',
              withPath,
            );
        },
        createBlob(withId, withTransform, withPath) {
          const path = document
            .createElementNS(
              'http://www.w3.org/2000/svg',
              'path',
            );
          path
            .setAttributeNS(
              null,
              'class',
              'blob',
            );
          path
            .setAttributeNS(
              null,
              'transform',
              `translate(${withTransform[0]}, ${withTransform[1]})`,
            );
          path
            .setAttribute(
              'd',
              withPath,
            );
          svg
            .appendChild(
              path,
            );
          // XXX: Come up with a better architecture. (Store for later.)
          paths[withId] = path;
        },
      },
    );

    b.putBlob(
      new Blob(
        'custom-blob-id',
        200,
        400,
        300,
        75,
        50,
      ),
    );
    svg.addEventListener(
      'mousedown',
      (e) => {
        b.onPointerDown(
          ...coordsGlobalToSVG(
            e.clientX,
            e.clientY,
          ),
        );
        e.stopPropagation();
        e.preventDefault();
      },
      false,
    );
    svg.addEventListener(
      'mousemove',
       (e) => {
         b.onPointerMoved(
          ...coordsGlobalToSVG(
            e.clientX,
            e.clientY,
          ),
        );
        e.stopPropagation();
        e.preventDefault();
      },
      false,
    );
    svg.addEventListener(
      'mouseup',
      (e) => {
        b.onPointerUp(
          ...coordsGlobalToSVG(
            e.clientX,
            e.clientY,
          ),
        );
        e.stopPropagation();
        e.preventDefault();
      },
      false,
    );
  },
);

// TODO: Clean these up.
const getViewportSize = () => {
  if (typeof window.innerWidth != 'undefined') {
	return [
      window.innerWidth,
      window.innerHeight,
    ];
  } else if (typeof document.documentElement != 'undefined'	&& typeof document.documentElement.clientWidth != 'undefined'	&& document.documentElement.clientWidth != 0) {
	return [
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    ];
  }
  return [0, 0];
};

function coordsGlobalToSVG(globalX, globalY) {
  const svg = document.getElementsByTagName("svg")[0];
  const viewBox = svg.viewBox.baseVal;
  const viewBoxWidth = viewBox.width;
  const viewBoxHeight = viewBox.height;
  const viewBoxRatio = viewBoxWidth / viewBoxHeight;
  const viewportSize = getViewportSize();
  const viewportRatio = viewportSize[0] / viewportSize[1];
	
  if (viewBoxRatio <= viewportRatio) {
	const viewBoxGlobalWidth = viewBoxWidth * (viewportSize[1] / viewBoxHeight);
	const viewBoxGlobalOriginX = (viewportSize[0] - viewBoxGlobalWidth) / 2;
    return [
      (globalX - viewBoxGlobalOriginX) * (viewBoxHeight / viewportSize[1]),
      globalY * (viewBoxHeight / viewportSize[1]),
    ];
  } else {
	const viewBoxGlobalHeight = viewBoxHeight * (viewportSize[0] / viewBoxWidth);		
	const viewBoxGlobalOriginY = (viewportSize[1] - viewBoxGlobalHeight) / 2;
    return [
      globalX * (viewBoxWidth / viewportSize[0]),
      (globalY - viewBoxGlobalOriginY) * (viewBoxWidth / viewportSize[0]),
    ];
  }
  return [0, 0];
};
