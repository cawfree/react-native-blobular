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
      
    };
  }
  onPointerMoved(x, y) {
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
      (e) => {
        const { clientX: x, clientY: y } = e;
        b.onPointerMoved(x, y);
      },
      false,
    );
    svg.addEventListener(
      'mousemove',
      (e) => {
        const { clientX: x, clientY: y } = e;
        b.onPointerMoved(x, y);
      },
      false,
    );
    svg.addEventListener(
      'mouseup',
      (e) => {
        const { clientX: x, clientY: y } = e;
        b.onPointerMoved(x, y);
      },
      false,
    );
  },
);
