const EVENT_TYPE_DRAG = 'event_drag';
const EVENT_TYPE_SEPARATE = 'event_separate';

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
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerMoved = this.onPointerMoved.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.putBlob = this.putBlob.bind(this);
    this.callback = callback;
    this.x = 0;
    this.y = 0;
    this.blobs = [];
    this.context = {
      // [blobId]: { /* context */ },
    };
    this.eventListeners = {
      
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
    if (blob) {
      const context = this.__getContext()[blob.getId()];
      const {
        bigCircleH,
        bigCircleK,
        bigCircleR,
      } = context;
      const originDistance = Math.sqrt(
        Math.pow(
          x - bigCircleH,
          2,
        ) + Math.pow(
          y - bigCircleK,
          2,
        ),
      );
      const smallCircleR = bigCircleR - originDistance;
      Object.assign(
        context,
        {
          bigCircleOriginH: bigCircleH,
          bigCircleOriginK: bigCircleK,
	      originDistance,
          smallCircleR,
          pointerCoords: [ // mousedownCoords
            x,
            y,
          ],
        },
      );
      // TODO: Radius which counts as a drag, abstract.
      if (originDistance < 20) {
        this.__addEventListener(
          EVENT_TYPE_DRAG,
          blob,
        );
        //this.__setSeparating(false); // mousemove, mouseup
      } else {
	    const bigCircleArea = Math.PI * Math.pow(
          bigCircleR,
          2,
        );
	    const smallCircleArea = Math.PI * Math.pow(
          smallCircleR,
          2,
        );
	    const afterCircleArea = bigCircleArea - smallCircleArea;
        Object.assign(
          context,
          {
            bigCircleRMax: bigCircleR,
            bigCircleRMin: Math.sqrt(
              afterCircleArea / Math.PI,
            ),
          },
        );
        this.__addEventListener(
          EVENT_TYPE_SEPARATE,
          blob,
        );
        //this.__setSeparating(true); // mousemoveSeparate, mouseupSeparate
      }
    }
    return;
  }
  getCircleYForX(h, r, x) {
    return Math.sqrt(
      Math.pow(
        r,
        2,
      ) - Math.pow(
        x - h,
        2,
      ),
    );
  }
  calculateAngle(origin, point) {
  const angle = Math.atan((point[1] - origin[1]) / (point[0] - origin[0])) / Math.PI * 180 + 90;
  return angle + ((point[0] < origin[0]) ? 180 : 0);
}
  // drawSomething
  render(blob, distance, angle, mode) { // join, separation
    const context = this.__getContext()[blob.getId()];
    const {
      bigCircleH,
      bigCircleK,
    } = context;
    Object.assign(
      context,
      {
        smallCircleK: - context.bigCircleRMax + context.smallCircleR - distance,
      },
    );
    if (mode === 'join') {
      Object.assign(
        context,
        {
          joinCircleRMin: 1,
          joinCircleRMax: 200,
        },
      );
    } else if (mode === 'separation') {
      Object.assign(
        context,
        {
          joinCircleR: blob.getViscosity(),
        },
      );
    }
    const startK = (mode === 'join') ? - context.bigCircleRMin - context.smallCircleR : - context.bigCircleRMax + context.smallCircleR - 1;
	const finalK = (mode === 'join') ? - context.bigCircleRMax + context.smallCircleR - 1: - context.bigCircleRMin - context.joinCircleR * 2 - context.smallCircleR;
	const differenceK = startK - finalK;
    const currDifferenceK = context.smallCircleK - finalK;
	const differencePercentage = currDifferenceK / differenceK;

    if (mode === 'join') {
      Object.assign(
        context,
        {
          bigCircleR: context.bigCircleRMax - (context.bigCircleRMax - context.bigCircleRMin) * differencePercentage,
          joinCircleR: context.joinCircleRMax - (context.joinCircleRMax - context.joinCircleRMin) * differencePercentage,
        },
      );
    } else if (mode === 'separation') {
      Object.assign(
        context,
        {
          bigCircleR: context.bigCircleRMin + (context.bigCircleRMax - context.bigCircleRMin) * differencePercentage,
        },
      );
    }

    const triangleA = context.bigCircleR + context.joinCircleR;
	const triangleB = context.smallCircleR + context.joinCircleR;
	const triangleC = Math.abs(
      context.smallCircleK,
    );
	const triangleP = (triangleA + triangleB + triangleC) * 0.5;

    const e = (triangleP * (triangleP - triangleA) * (triangleP - triangleB) * (triangleP - triangleC));
    const triangleArea = Math.sqrt(mode === 'join' ? e : Math.abs(e));
    const isBigger = (triangleC >= triangleA);

    const triangleH = isBigger ? 2 * triangleArea / triangleC : 2 * triangleArea / triangleA;
    const triangleD = isBigger ? Math.sqrt(Math.pow(triangleA, 2) - Math.pow(triangleH, 2)) : Math.sqrt(Math.pow(triangleC, 2) - Math.pow(triangleH, 2));

    const bigCircleTan = triangleH / triangleD;
	const bigCircleAngle = Math.atan(bigCircleTan);
	const bigCircleSin = Math.sin(bigCircleAngle);
	const bigCircleIntersectX = bigCircleSin * context.bigCircleR;
	const bigCircleCos = Math.cos(bigCircleAngle);
	const bigCircleIntersectY = bigCircleCos * context.bigCircleR;

    const joinCircleH = bigCircleSin * (context.bigCircleR + context.joinCircleR);
	const joinCircleK = -bigCircleCos * (context.bigCircleR + context.joinCircleR);

    const coord1X = -bigCircleIntersectX;
	const coord1Y = -bigCircleIntersectY;
	const coord2X = bigCircleIntersectX;
	const coord2Y = -bigCircleIntersectY;

    const smallCircleTan = (context.smallCircleK - joinCircleK) / (context.smallCircleH - joinCircleH);
	const smallCircleAngle = Math.atan(smallCircleTan);
	const smallCircleIntersectX = joinCircleH - Math.cos(smallCircleAngle) * (context.joinCircleR);
	const smallCircleIntersectY = joinCircleK - Math.sin(smallCircleAngle) * (context.joinCircleR);

    const x = joinCircleH - context.joinCircleR <= 0 && context.smallCircleK < joinCircleK;
	const crossOverY = this.getCircleYForX(
      joinCircleH,
      context.joinCircleR,
      0,
    );
    const largeArcFlag = (joinCircleK < context.smallCircleK) ? 0 : 1;
    const isOverlap = (joinCircleH - context.joinCircleR <= 0 && context.smallCircleK < joinCircleK);

    const path = [
      "M " + coord1X + " " + coord1Y + " A " + context.bigCircleR + " " + context.bigCircleR + " 0 1 0 " + coord2X + " " + coord2Y,
      (!!x) && "A " + context.joinCircleR + " " + context.joinCircleR + " 0 0 1 0 " + (joinCircleK + crossOverY),
      (!!x) && "m 0 -" + (crossOverY * 2),
      "A " + context.joinCircleR + " " + context.joinCircleR + " 0 0 1 " + smallCircleIntersectX + " " + smallCircleIntersectY,
      "a " + context.smallCircleR + " " + context.smallCircleR + " 0 " + largeArcFlag + " 0 " + (smallCircleIntersectX * -2) + " 0",
      (!!isOverlap) && "A " + context.joinCircleR + " " + context.joinCircleR + " 0 0 1 0 " + (joinCircleK - crossOverY),
      (!!isOverlap) && "m 0 " + (crossOverY * 2),
      "A " + context.joinCircleR + " " + context.joinCircleR + " 0 0 1 " + coord1X + " " + coord1Y,
      "A " + context.joinCircleR + " " + context.joinCircleR + " 0 0 1 " + coord1X + " " + coord1Y,
    ]
      .filter(e => !!e)
      .join();

    return this.__getCallback()
      .updateBlob(
        blob.getId(),
        [
          bigCircleH,
          bigCircleK,
        ],
        angle,
        path,
        mode,
    );
  }
  __addEventListener(eventType, blob) {
    const existing = this.__getEventListeners[eventType] || [];
    if (existing.indexOf(blob) < 0) {
      return this.__setEventListeners(
        {
          ...this.__getEventListeners(),
          [eventType]: [
            ...existing,
            blob,
          ],
        },
      );
    }
    throw new Error(
      `Blob "${blob.getId()} is already configured to listen to the ${eventType} event!"`,
    );
  }
  __removeEventListener(eventType, blob) {
    const existing = this.__getEventListeners[eventType];
    if (existing) {
      return this.__setEventListeners(
        {
          ...this.__getEventListeners(),
          [eventType]: existing
            .filter(
              e => (e.getId() !== blob.getId()),
            ),
        },
      );
    }
    throw new Error(
      `Attempted to unregister a listener for ${eventType}, when none have been allocated.`,
    );
  }
  // mousemove
  __onPointerMovedDrag(x, y, activeBlob) {
    const activeContext = this.__getContext()[activeBlob.getId()];
    const {
      bigCircleOriginH,
      bigCircleOriginK,
      pointerCoords,
    } = activeContext;
    // TODO: request set lavaPath attribute? huh?
    Object.assign(
      activeContext,
      {
        bigCircleH: bigCircleOriginH + x - pointerCoords[0],
        bigCircleK: bigCircleOriginK + y - pointerCoords[1],
      },
    );
    const {
      bigCircleH,
      bigCircleK,
      bigCircleR,
    } = activeContext;
    const otherBlobs = this.__getBlobs()
      .filter(e => e.getId() !== activeBlob.getId());
    for (let i = 0; i < otherBlobs.length; i += 1) {
      const otherBlob = otherBlobs[i];
      const otherContext = this.__getContext()[otherBlob.getId()];
	  const distance = Math.sqrt(
        Math.pow(
          bigCircleH - otherContext.bigCircleH,
          2,
        ) + Math.pow(
          bigCircleK - otherContext.bigCircleK,
          2,
        ),
      );
      if (distance < bigCircleR + otherContext.bigCircleR) {
        const bigCircleArea = Math.PI * Math.pow(
          otherContext.bigCircleR,
          2,
        );
        const smallCircleArea = Math.PI * Math.pow(
          bigCircleR,
          2,
        );
        const afterCircleArea = bigCircleArea + smallCircleArea;
        if (bigCircleR < otherContext.bigCircleR) {
          Object.assign(
            otherContext,
            {
              bigCircleRMin: otherContext.bigCircleR,
              bigCircleRMax: Math.sqrt(
                afterCircleArea / Math.PI,
              ),
              smallCircleR: bigCircleR,
              smallCircleOriginH: bigCircleOriginH,
              smallCircleOriginK: bigCircleOriginK,
              pointerCoords: [
                ...pointerCoords,
              ],
            },
          );
	      const distanceDiff = Math.max(
            distance - otherContext.bigCircleRMax + otherContext.smallCircleR,
            1,
          );
          this.render(
            otherBlob,
            distanceDiff,
            this.calculateAngle(
              [
                otherContext.bigCircleH,
                otherContext.bigCircleK,
              ],
              [
                activeContext.bigCircleH,
                activeContext.bigCircleK,
              ],
            ),
            'join',
          );

          // TODO: NEED ROUTING PATTERN HERE! HOW TO DO EVENTS?
          console.log('would join normal');
  
          this.__shouldDeleteBlob(activeBlob);
        } else {
          Object.assign(
            otherContext,
            {
              bigCircleRMin: activeContext.bigCircleR,
              bigCircleRMax: Math.sqrt(
                afterCircleArea / Math.PI,
              ),
              smallCircleR: otherContext.bigCircleR,
              smallCircleOriginH: otherContext.bigCircleH,
              smallCircleOriginK: otherContext.bigCircleK,
              bigCircleR: activeContext.bigCircleR,
              bigCircleH: activeContext.bigCircleH,
              bigCircleL: activeContext.bigCircleK,
              bigCircleOriginH: activeContext.bigCircleOriginH,
              bigCircleOriginK: activeContext.bigCircleOriginK,
              pointerCoords: activeContext.pointerCoords,
            },
          );

	      const distanceDiff = Math.max(
            distance - otherContext.bigCircleRMax + otherContext.smallCircleR,
            1,
          );

          this.render(
            otherBlob,
            distanceDiff,
            this.calculateAngle(
              [
                otherContext.bigCircleH,
                otherContext.bigCircleK,
              ],
              [
                otherContext.smallCircleOriginH,
                otherContext.smallCircleOriginK,
              ],
            ),
            'join',
          );

          // TODO: listener i/o here!
          this.__shouldDeleteBlob(
            activeBlob,
          );
        }
        break;
      }
    }
  }
  // mousemoveSeparate
  __onPointerMovedSeparate(x, y, activeBlob) {
    const activeContext = this.__getContext()[activeBlob.getId()];
	const distance = Math.sqrt(
      Math.pow(
        x - activeContext.bigCircleH,
        2,
      ) + Math.pow(
        y - activeContext.bigCircleK,
        2,
      ),
    );
	if (distance > activeContext.bigCircleR + activeContext.joinCircleR * 2 + activeContext.smallCircleR) {
      const detached = new Blob(
        `detached-${Math.random()}`,
        activeContext.smallCircleR,
        x,
        y,
        activeBlob.getViscosity(),
        activeBlob.getSmallestRadius(),
      );
      // TODO: X and Y should not belong to the blob, should belong to put! fix this!
      this.putBlob(
        detached,
      );
      // TODO: Need to propagate this info (reason?) back to the caller for rendering
	  //detached.lavaPath.setAttributeNS(null, "class", "lavaPath joining");
      // TODO: requires event handling pattern here!
      Object.assign(
        activeContext,
        {
          bigCircleR: activeContext.bigCircleRMin,
        },
      );
      // TODO: needs a reset here!
    } else {
	  const distanceDiff = Math.max(distance - activeContext.originDistance, 1);
      this.render(
        activeBlob,
        distanceDiff,
        this.calculateAngle(
          [
            activeContext.bigCircleH,
            activeContext.bigCircleK,
          ],
          [
            x,
            y,
          ],
        ),
        'separation',
      );
    }
  }
  onPointerMoved(x, y) {
    this.x = x;
    this.y = y;
    const eventListeners = this.__getEventListeners();
    (eventListeners[EVENT_TYPE_DRAG] || [])
      .map(
        (blob) => {
          this.__onPointerMovedDrag(
            x,
            y,
            blob,
          );
          // XXX: This is used as some kind of forceUpdate()?
          this.__doReset(blob);
        },
      );
    (eventListeners[EVENT_TYPE_SEPARATE] || [])
      .map(
        (blob) => {
          this.__onPointerMovedSeparate(
            x,
            y,
            blob,
          );
        },
      );
  }
  // TODO: remove this call
  __doReset(activeBlob) {
    const activeContext = this.__getContext()[activeBlob.getId()];
    // TODO: need to call reset() here, but what does that mean in terms of deleted context? what about initial positions, etc?
    const {
      transform,
      path,
    } = this.__getResetData(
      activeBlob.getId(),
      activeContext,
    );
    this.__getCallback()
      .updateBlob(
        activeBlob.getId(),
        transform,
        0,
        path,
        undefined, // unknown mode...?
      );
  }
  __shouldDeleteBlob(blob) {
    this.__setBlobs(
      this.__getBlobs()
        .filter(
          e => (e.getId() !== blob.getId()),
        ),
    );
    Object.assign(
      this.__getContext(),
      {
        [blob.getId()]: undefined,
      },
    );
    // TODO: obviously delete all, since it would not be possible to interact
    //       or iterate against at all afterwards
    // TODO: MISSING DELETE LOCAL CONTEXT + BLOB REF, IMPORTANT
    //       OR JUST THE PATH DATA??!?!?!?
    this.__getCallback()
      .deleteBlob(
        blob
          .getId(),
      );
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
  __setEventListeners(eventListeners) {
    this.eventListeners = eventListeners;
  }
  __getEventListeners() {
    return this.eventListeners;
  }
}

const getSvg = () => document
  .getElementsByTagName('svg')[0];

window.addEventListener(
  'load',
  () => {
    const svg = getSvg();
    const paths = {};
    const b = new BlobularCompat(
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
                'lavaPath joining',
              );
          } else if (withMode === 'separation') {
          }
          path
            .setAttributeNS(
              null,
              'transform',
              `translate(${withTransform[0]}, ${withTransform[1]}) rotate(${withRotation}, 0, 0)`,
            );
          path
            .setAttribute(
              'd',
              withPath,
            );
          // TODO: more rendering...
        },
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
