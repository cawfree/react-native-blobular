const uuidv4 = require('uuid/v4');

const EVENT_TYPE_DRAG = 'event_drag';
const EVENT_TYPE_SEPARATE = 'event_separate';
const EVENT_TYPE_JOIN = 'event_join';
const EVENT_TYPE_JOIN_ALT = 'event_joinAlt';

class Blob {
  constructor(id, radius, viscosity, smallestRadius) {
    this.id = id;
    this.radius = radius;
    this.viscosity = viscosity;
    this.smallestRadius = smallestRadius;
  }
  getId() {
    return this.id;
  }
  getRadius() {
    return this.radius;
  }
  getViscosity() {
    return this.viscosity;
  }
  getSmallestRadius() {
    return this.smallestRadius;
  }
}

class Blobular {
  constructor(
    callback,
  ) {
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerMoved = this.onPointerMoved.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.putBlob = this.putBlob.bind(this);
    this.callback = callback;
    this.blobs = [];
    this.context = {};
    this.eventListeners = {};
  }
  onPointerDown(x, y) {
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
      if (originDistance < 20) {
        this.__addEventListener(
          EVENT_TYPE_DRAG,
          blob,
        );
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
      }
    }
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
    const existing = this.__getEventListeners()[eventType];
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
  __onPointerMovedDrag(x, y, activeBlob) {
    const activeContext = this.__getContext()[activeBlob.getId()];
    const {
      bigCircleOriginH,
      bigCircleOriginK,
      pointerCoords,
    } = activeContext;
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
              smallCircleR: activeContext.bigCircleR,
              smallCircleOriginH: activeContext.bigCircleOriginH,
              smallCircleOriginK: activeContext.bigCircleOriginK,
              pointerCoords,
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
          this.__addEventListener(
            EVENT_TYPE_JOIN, // TODO needs to exist
            otherBlob,
          );
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
              bigCircleK: activeContext.bigCircleK,
              bigCircleOriginH: activeContext.bigCircleOriginH,
              bigCircleOriginK: activeContext.bigCircleOriginK,
              pointerCoords,
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
          this.__addEventListener(
            EVENT_TYPE_JOIN_ALT,
            otherBlob,
          );
        }
        this.__shouldDeleteBlob(
          activeBlob,
        );
        return;
      }
    }
    this.__doReset(activeBlob);
  }
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
        uuidv4(),
        activeContext.smallCircleR,
        activeBlob.getViscosity(),
        activeBlob.getSmallestRadius(),
      );
      this.putBlob(
        detached,
        x,
        y,
      );
      this.__addEventListener(
        EVENT_TYPE_DRAG,
        detached,
      );
      this.__removeEventListener(
        EVENT_TYPE_SEPARATE,
        activeBlob,
      );
      Object.assign(
        activeContext,
        {
          bigCircleR: activeContext.bigCircleRMin,
        },
      );
      this.__doReset(
        activeBlob,
      );
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
  __onPointerMovedJoin(x, y, blob) {
    const context = this.__getContext()[blob.getId()];
    const distance = Math.sqrt(
      Math.pow(
        context.smallCircleOriginH + x - context.pointerCoords[0] - context.bigCircleH,
        2,
      ) + Math.pow(
        context.smallCircleOriginK + y - context.pointerCoords[1] - context.bigCircleK,
        2,
      ),
    );
    if (distance > context.bigCircleRMin + context.smallCircleR) {
      const detached = new Blob(
        uuidv4(),
        context.smallCircleR,
        blob.getViscosity(),
        blob.getSmallestRadius(),
      );
      this.putBlob(
        detached,
        x,
        y,
      );
      this.__addEventListener(
        EVENT_TYPE_DRAG,
        detached,
      );
      this.__removeEventListener(
        EVENT_TYPE_JOIN,
        blob,
      );
      Object.assign(
        context,
        {
          bigCircleR: context.bigCircleRMin,
        },
      );
      this.__doReset(
        blob,
      );
    } else {
	  const distanceDiff = Math.max(
        distance - context.bigCircleRMax + context.smallCircleR,
        1,
      );
      this.render(
        blob,
        distanceDiff,
        this.calculateAngle(
          [
            context.bigCircleH,
            context.bigCircleK,
          ],
          [
            context.smallCircleOriginH + x - context.pointerCoords[0],
            context.smallCircleOriginK + y - context.pointerCoords[1],
          ],
        ),
        'join',
      );
    }
  }
  __onPointerMovedJoinAlt(x, y, blob) {
    const context = this.__getContext()[blob.getId()];
    Object.assign(
      context,
      {
        bigCircleH: context.bigCircleOriginH + x - context.pointerCoords[0],
        bigCircleK: context.bigCircleOriginK + y - context.pointerCoords[1],
      },
    );

    const distance = Math.sqrt(
      Math.pow(
        context.bigCircleH - context.smallCircleOriginH,
        2,
      ) + Math.pow(
        context.bigCircleK - context.smallCircleOriginK,
        2,
      ),
    );

	if (distance > context.bigCircleRMin + context.smallCircleR) {
      const detached = new Blob(
        uuidv4(),
        context.smallCircleR,
        blob.getViscosity(),
        blob.getSmallestRadius(),
      );
      this.putBlob(
        detached,
        context.smallCircleOriginH,
        context.smallCircleOriginK,
      );
      this.__addEventListener(
        EVENT_TYPE_DRAG,
        blob,
      );
      this.__removeEventListener(
        EVENT_TYPE_JOIN_ALT,
        blob,
      );
      Object.assign(
        context,
        {
          bigCircleR: context.bigCircleRMin,
        },
      );
      this.__doReset(
        blob,
      );
    } else {
	  const distanceDiff = Math.max(
        distance - context.bigCircleRMax + context.smallCircleR,
        1,
      );
      this.render(
        blob,
        distanceDiff,
        this.calculateAngle(
          [
            context.bigCircleH,
            context.bigCircleK,
          ],
          [
            context.smallCircleOriginH,
            context.smallCircleOriginK,
          ],
        ),
        'join',
      );
    }
  }
  onPointerMoved(x, y) {
    const eventListeners = this.__getEventListeners();
    (eventListeners[EVENT_TYPE_DRAG] || [])
      .map(
        (blob) => {
          this.__onPointerMovedDrag(
            x,
            y,
            blob,
          );
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
    (eventListeners[EVENT_TYPE_JOIN] || [])
      .map(
        (blob) => {
          this.__onPointerMovedJoin(
            x,
            y,
            blob,
          );
        },
      );
    (eventListeners[EVENT_TYPE_JOIN_ALT] || [])
      .map(
        (blob) => {
          this.__onPointerMovedJoinAlt(
            x,
            y,
            blob,
          );
        },
      );
  }
  __doReset(activeBlob) {
    const activeContext = this.__getContext()[activeBlob.getId()];
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
        null,
        path,
        undefined,
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
        [blob.getId()]: null,
      },
    );
    this.__setEventListeners(
      Object.entries(this.__getEventListeners())
        .reduce(
          (obj, [eventType, listeners]) => {
            return {
              ...obj,
              [eventType]: listeners
                .filter(
                  e => (e.getId() !== blob.getId()),
                ),
            };
          },
          {},
        ),
    );
    this.__getCallback()
      .deleteBlob(
        blob
          .getId(),
      );
  }
  __onPointerUpDrag(x, y, blob) {
    this.__removeEventListener(
      EVENT_TYPE_DRAG,
      blob,
    );
  }
  __onPointerUpSeparate(x, y, blob) {
    this.__collapse(
      x,
      y,
      blob,
    );
    this.__removeEventListener(
      EVENT_TYPE_SEPARATE,
      blob,
    );
  }
  __onPointerUpJoin(x, y, blob) {
    this.__join(
      x,
      y,
      blob,
    );
    this.__removeEventListener(
      EVENT_TYPE_JOIN,
      blob,
    );
  }
  __onPointerUpJoinAlt(x, y, blob) {
    const context = this.__getContext()[blob.getId()];
    this.__join(
      context.smallCircleOriginH,
      context.smallCircleOriginK,
      blob,
    );
    this.__removeEventListener(
      EVENT_TYPE_JOIN_ALT,
      blob,
    );
  }
  // TODO: provide the callback with an iterator
  __join(x, y, blob) {
    const context = this.__getContext()[blob.getId()];
    const increment = 20;
	const newK = context.smallCircleK + increment;
    if (newK > -context.bigCircleR + context.smallCircleR - 1) {
      const { bigCircleRMax } = context;
      Object.assign(
        context,
        {
          bigCircleR: bigCircleRMax,
        },
      );
      this.__doReset(
        blob,
      );
    } else {
      const distance = -newK - (context.bigCircleRMax - context.smallCircleR);
      const angle = this.calculateAngle(
        [
          context.bigCircleH,
          context.bigCircleK,
        ],
        [
          x,
          y,
        ],
      );
      this.render(
        blob,
        distance,
        angle,
        'join',
      );
      setTimeout(
        () => this.__join(x, y, blob),
        1,
      );
    }
  }
  __collapse(x, y, blob) {
    const context = this.__getContext()[blob.getId()];
    const increment = blob.getViscosity() / 4;
	const newK = context.smallCircleK + increment;
    if (newK > -context.bigCircleR + context.smallCircleR - 1) {
      const { bigCircleRMax } = context;
      Object.assign(
        context,
        {
          bigCircleR: bigCircleRMax,
        },
      );
      this.__doReset(
        blob,
      );
	} else {
	  const distance = -newK - (context.bigCircleRMax - context.smallCircleR);
	  const angle = this.calculateAngle(
        [
          context.bigCircleH,
          context.bigCircleK,
        ],
        [
          x,
          y,
        ],
      );
      this.render(
        blob,
        distance,
        angle,
        'separation',
      );
      setTimeout(
        () => this.__collapse(x, y, blob),
        1,
      );
	}
  }
  onPointerUp(x, y) {
    const eventListeners = this.__getEventListeners();
    (eventListeners[EVENT_TYPE_DRAG] || [])
      .map(
        blob => this.__onPointerUpDrag(x, y, blob),
      );
    (eventListeners[EVENT_TYPE_SEPARATE] || [])
      .map(
        blob => this.__onPointerUpSeparate(x, y, blob),
      );
    (eventListeners[EVENT_TYPE_JOIN] || [])
      .map(
        blob => this.__onPointerUpJoin(x, y, blob),
      );
    (eventListeners[EVENT_TYPE_JOIN_ALT] || [])
      .map(
        blob => this.__onPointerUpJoinAlt(x, y, blob),
      );

  }
  putBlob(blob, x, y) {
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
        x,
        y,
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
  __createBlobContext(blob, x, y) {
    return {
      bigCircleR: blob.getRadius(),
      bigCircleH: x,
      bigCircleK: y,
      bigCircleOriginH: x,
      bigCircleOriginK: y,
      joinCircleR: blob.getViscosity(),
      smallCircleR: blob.getSmallestRadius(),
      smallCircleH: 0,
      smallCircleK: - blob.getRadius() + blob.getSmallestRadius() - 1,
      pointerCoords: [
        x,
        y,
      ],
    };
  }
  __getResetData(blobId, blobContext) {
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

module.exports = {
  default: Blobular,
  Blobular,
  Blob,
};
