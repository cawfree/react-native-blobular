class Blob {
  constructor(id, radius, x, y, viscosity, smallestRadius) {
    this.id = id;
    this.radius = radius;
    this.x = x;
    this.y = y;
    this.viscosity = viscosity;
    this.smallestRadius = smallestRadius;
  }
  getId() {
    return this.id;
  }
  getRadius() {
    return this.radius;
  }
  getX() {
    return this.x;
  }
  getY() {
    return this.y;
  }
  getViscosity() {
    return this.viscosity;
  }
  getSmallestRadius() {
    return this.smallestRadius;
  }
}

class BlobularCompat {
  constructor(
    callback,
  ) {
    this.onPointerMoved = this.onPointerMoved.bind(this);
    this.putBlob = this.putBlob.bind(this);
    this.callback = callback;
    this.x = 0;
    this.y = 0;
    this.blobs = [];
    this.context = {
      // [blobId]: { /* context */ },
    };
  }
  onPointerDown(x, y) {
    this.x = x;
    this.y = y;
    const blob = this.__getBlobs()
      .map((e, i, arr) => (arr[arr.length - 1 - i]))
      .reduce(
        (b, p) => {
          const id = p
            .getId();
          const context = this.__getContext()[id];
          const { 
            bigCircleR,
            bigCircleH,
            bigCircleK,
          } = context;
          const dx = x - bigCircleH;
          const dy = y - bigCircleK;
          const dist = Math
            .sqrt(
              Math.pow(dx, 2) + Math.pow(dy, 2)
            );
          return b || ((dist <= bigCircleR) && p);
        },
        null,
      );
    console.log('got ',blob);
  }
  onPointerMoved(x, y) {
    this.x = x;
    this.y = y;
  }
  onPointerUp(x, y) {
    this.x = x;
    this.y = y;
  }
  putBlob(blob) {
    const id = blob
      .getId();
    if (typeof id !== 'string') {
      throw new Error(
        `Expected string id, found ${typeof id}.`,
      );
    }
    const available = this.__getBlobs()
      .reduce(
        (result, blob) => result && (
          blob.getId() !== id
        ),
        true,
      );
    if (available) {
      this.__setBlobs(
        [
          ...this.__getBlobs(),
          blob,
        ],
      );
      const blobContext = this.__createBlobContext(
        blob,
      );
      this.__setContext(
        {
          ...this.__getContext(),
          [id]: blobContext,
        },
      );
      const {
        transform,
        path,
      } = this.__getResetData(
        id,
        blobContext,
      );
      const { createBlob } = this.__getCallback();
      return createBlob(
        id,
        transform,
        path,
      );
    }
    throw new Error(
      `Attempted to allocate a blob with an existing identifier, "${id}".`,
    );
  }
  __setBlobs(blobs) {
    this.blobs = blobs;
  }
  __getBlobs() {
    return this.blobs;
  }
  __createBlobContext(blob) { // eq  -> reset
    return {
      bigCircleR: blob.getRadius(),
      bigCircleH: blob.getX(), //h -> x, k -> y
      bigCircleK: blob.getY(),
      bigCircleOriginH: blob.getX(),
      bigCircleOriginK: blob.getY(),
      joinCircleR: blob.getViscosity(),
      smallCircleR: blob.getSmallestRadius(),
      smallCircleH: 0,
      smallCircleK: - blob.getRadius() + blob.getSmallestRadius() - 1,
    };
  }
  __getResetData(blobId, blobContext = {}) {
    const {
      bigCircleH,
      bigCircleK,
      bigCircleR,
    } = blobContext;
    const transform = [
      bigCircleH,
      bigCircleK,
    ];
    const path = [
      `m 0 ${-bigCircleR} A ${bigCircleR} ${bigCircleR} 0 1 1 0 ${bigCircleR}`,
      `A ${bigCircleR} ${bigCircleR} 0 1 1 0 ${-bigCircleR}`,
    ]
      .join('');
    return {
      transform,
      path,
    };
  }
  __setContext(context) {
    this.context = context;
  }
  __getContext() {
    return this.context;
  }
  __getCallback() {
    return this.callback;
  }
}

const getSvg = () => document
  .getElementsByTagName('svg')[0];

window.addEventListener(
  'load',
  () => {
    const svg = getSvg();
    const b = new BlobularCompat(
      {
        createBlob(withId, withTransform, withPath) {
          // lavaPath
          const path = document
            .createElementNS(
              'http://www.w3.org/2000/svg',
              'path',
            );
          path
            .setAttributeNS(
              null,
              'class',
              'lavaPath',
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
      e => b.onPointerDown(
        ...coordsGlobalToSVG(
          e.clientX,
          e.clientY,
        ),
      ),
      false,
    );
    svg.addEventListener(
      'mousemove',
       e => b.onPointerMove(
        ...coordsGlobalToSVG(
          e.clientX,
          e.clientY,
        ),
      ),
      false,
    );
    svg.addEventListener(
      'mouseup',
      e => b.onPointerUp(
        ...coordsGlobalToSVG(
          e.clientX,
          e.clientY,
        ),
      ),
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
