const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const CENTERX = 400;
const CENTERY = 300;
const VISCOSITY = 75;

window.addEventListener(
  'load',
  () => new Blob(
    200,
    CENTERX,
    CENTERY,
  ),
  false,
);

function Blob(radius, h, k) {

  this.bigCircleR = radius;
  this.bigCircleH = h;
  this.bigCircleK = k;
  this.bigCircleOriginH = h;
  this.bigCircleOriginK = k;
  this.mousedownCoords = [h, k];
  this.joinCircleR = VISCOSITY;
  this.smallCircleR = 50;
  this.smallCircleH = 0;
  this.smallCircleK = 0 - this.bigCircleR + this.smallCircleR - 1;
		
  this.lavaPath = document.createElementNS(SVG_NS, "path");
  this.lavaPath.setAttributeNS(null, "class", "lavaPath");
  this.lavaPath.objRef = this;
	
  this.reset = function() {
  this.lavaPath.setAttributeNS(
    null, 
    'transform',
    `translate(${this.bigCircleH}, ${this.bigCircleK})`,
  );
  this.lavaPath.setAttribute(
    'd',
      [
        `m 0 ${-this.bigCircleR} A ${this.bigCircleR} ${this.bigCircleR} 0 1 1 0 ${this.bigCircleR}`,
        `A ${this.bigCircleR} ${this.bigCircleR} 0 1 1 0 ${-this.bigCircleR}`,
      ]
        .join(''),
    );
  };
  //mode = [join, separation]
  this.drawSomething = (distance, angle, mode) => {
    if (mode === 'join') {
	  this.lavaPath.setAttributeNS(null, "class", "lavaPath joining");
    }
    this.lavaPath.setAttributeNS(
      null,
      'transform',
      `translate(${this.bigCircleH}, ${this.bigCircleK}) rotate(${angle}, 0, 0)`,
    );
	this.smallCircleK = 0 - this.bigCircleRMax + this.smallCircleR - distance;
    if (mode === 'join') {
	  this.joinCircleRMin = 1;
	  this.joinCircleRMax = 200;
    } else if (mode === 'separation') {
	  this.joinCircleR = VISCOSITY;
    }

    const startK = (mode === 'join') ? 0 - this.bigCircleRMin - this.smallCircleR : 0 - this.bigCircleRMax + this.smallCircleR - 1;
	const finalK = (mode === 'join') ? 0 - this.bigCircleRMax + this.smallCircleR - 1: 0 - this.bigCircleRMin - this.joinCircleR * 2 - this.smallCircleR;
	const differenceK = startK - finalK;
    const currDifferenceK = this.smallCircleK - finalK;
	const differencePercentage = currDifferenceK / differenceK;

    if (mode === 'join') {
	  this.bigCircleR = this.bigCircleRMax - (this.bigCircleRMax - this.bigCircleRMin) * differencePercentage;
	  this.joinCircleR = this.joinCircleRMax - (this.joinCircleRMax - this.joinCircleRMin) * differencePercentage;
    } else if (mode === 'separation') {
	  this.bigCircleR = this.bigCircleRMin + (this.bigCircleRMax - this.bigCircleRMin) * differencePercentage;
    }
	
    const triangleA = this.bigCircleR + this.joinCircleR; // Side a
	const triangleB = this.smallCircleR + this.joinCircleR; // Side b
	const triangleC = Math.abs(this.smallCircleK); // Side c
	const triangleP = (triangleA + triangleB + triangleC) / 2; // Triangle half perimeter

    const e = (triangleP * (triangleP - triangleA) * (triangleP - triangleB) * (triangleP - triangleC));
    const triangleArea = Math.sqrt(mode === 'join' ? e : Math.abs(e));
    const isBigger = (triangleC >= triangleA);

    const triangleH = isBigger ? 2 * triangleArea / triangleC : 2 * triangleArea / triangleA;
    const triangleD = isBigger ? Math.sqrt(Math.pow(triangleA, 2) - Math.pow(triangleH, 2)) : Math.sqrt(Math.pow(triangleC, 2) - Math.pow(triangleH, 2));

    const bigCircleTan = triangleH / triangleD;
	const bigCircleAngle = Math.atan(bigCircleTan);
	const bigCircleSin = Math.sin(bigCircleAngle);
	const bigCircleIntersectX = bigCircleSin * this.bigCircleR;
	const bigCircleCos = Math.cos(bigCircleAngle);
	const bigCircleIntersectY = bigCircleCos * this.bigCircleR;

	const joinCircleH = bigCircleSin * (this.bigCircleR + this.joinCircleR);
	const joinCircleK = -bigCircleCos * (this.bigCircleR + this.joinCircleR);

    const coord1X = -bigCircleIntersectX;
	const coord1Y = -bigCircleIntersectY;
	const coord2X = bigCircleIntersectX;
	const coord2Y = -bigCircleIntersectY;

    const smallCircleTan = (this.smallCircleK - joinCircleK) / (this.smallCircleH - joinCircleH);
	const smallCircleAngle = Math.atan(smallCircleTan);
	const smallCircleIntersectX = joinCircleH - Math.cos(smallCircleAngle) * (this.joinCircleR);
	const smallCircleIntersectY = joinCircleK - Math.sin(smallCircleAngle) * (this.joinCircleR);

    const x = joinCircleH - this.joinCircleR <= 0 && this.smallCircleK < joinCircleK;
	const crossOverY = getCircleYForX(joinCircleH, this.joinCircleR, 0);
    const largeArcFlag = (joinCircleK < this.smallCircleK) ? 0 : 1;
    const isOverlap = (joinCircleH - this.joinCircleR <= 0 && this.smallCircleK < joinCircleK);

	this.lavaPath.setAttribute(
      'd',
      [
        "M " + coord1X + " " + coord1Y + " A " + this.bigCircleR + " " + this.bigCircleR + " 0 1 0 " + coord2X + " " + coord2Y,
        (!!x) && "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 0 " + (joinCircleK + crossOverY),
        (!!x) && "m 0 -" + (crossOverY * 2),
        "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 " + smallCircleIntersectX + " " + smallCircleIntersectY,
        "a " + this.smallCircleR + " " + this.smallCircleR + " 0 " + largeArcFlag + " 0 " + (smallCircleIntersectX * -2) + " 0",
        (!!isOverlap) && "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 0 " + (joinCircleK - crossOverY),
        (!!isOverlap) && "m 0 " + (crossOverY * 2),
        "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 " + coord1X + " " + coord1Y,
        "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 " + coord1X + " " + coord1Y,
      ]
        .filter(e => !!e)
        .join(),
    );
  }
	
  this.collapse = (coords) => {
    const increment = VISCOSITY / 4;
	const newK = this.smallCircleK + increment;
    if (newK > -this.bigCircleR + this.smallCircleR - 1) {
	  this.bigCircleR = this.bigCircleRMax;
	  this.reset();
	} else {
	  const distance = -newK - (this.bigCircleRMax - this.smallCircleR);
	  const angle = calculateAngle([this.bigCircleH, this.bigCircleK], coords);
	  this.drawSomething(
        distance,
        angle, 
        'separation',
      );

      setTimeout(
        () => this.collapse(coords),
        25,
      );
	}
  }
	
  this.join = (coords) => {
    const increment = 20;
	const newK = this.smallCircleK + increment;
    if (newK > -this.bigCircleR + this.smallCircleR - 1) {
      this.bigCircleR = this.bigCircleRMax;
      this.lavaPath.setAttributeNS(null, "class", "lavaPath");
      this.reset();
    } else {
      const distance = -newK - (this.bigCircleRMax - this.smallCircleR);
      const angle = calculateAngle([this.bigCircleH, this.bigCircleK], coords);
      this.drawSomething(distance, angle, 'join');
      setTimeout(
        () => this.join(coords),
        25,
      );
    }
  }
	
  this.mousedown = (event) => {
    this.mousedownCoords = coordsGlobalToSVG(event.clientX, event.clientY);
	this.bigCircleOriginH = this.bigCircleH;
	this.bigCircleOriginK = this.bigCircleK;
	this.originDistance = Math.sqrt(Math.pow(this.mousedownCoords[0] - this.bigCircleH, 2) + Math.pow(this.mousedownCoords[1] - this.bigCircleK, 2));
	this.smallCircleR = this.bigCircleR - this.originDistance;

	/* If click in centre, move blob instead of separating */
	if (this.originDistance < 20) {
	  document.addEventListener("mousemove", this.mousemove, false);
	  document.addEventListener("mouseup", this.mouseup, false);
	} else {
	  const bigCircleArea = Math.PI * Math.pow(this.bigCircleR, 2);
	  const smallCircleArea = Math.PI * Math.pow(this.smallCircleR, 2);
	  const afterCircleArea = bigCircleArea - smallCircleArea;
	  this.bigCircleRMax = this.bigCircleR;
	  this.bigCircleRMin = Math.sqrt(afterCircleArea / Math.PI);
	  document.addEventListener("mousemove", this.mousemoveSeparate, false);
	  document.addEventListener("mouseup", this.mouseupSeparate, false);
	}
    suppressPropagation(event);
  };
  this.mousemove = (event) => {
	const coords = coordsGlobalToSVG(event.clientX, event.clientY);
	this.lavaPath.setAttributeNS(null, "class", "lavaPath");

	this.bigCircleH = this.bigCircleOriginH + coords[0] - this.mousedownCoords[0];
	this.bigCircleK = this.bigCircleOriginK + coords[1] - this.mousedownCoords[1];
		
	const paths = document.getElementsByTagName("path");

	for (let i = 0; i < paths.length; i++) {
	  const objRef = paths[i].objRef;
	  const distance = Math.sqrt(Math.pow(this.bigCircleH - objRef.bigCircleH, 2) + Math.pow(this.bigCircleK - objRef.bigCircleK, 2))
	  if (paths[i] != this.lavaPath && distance < this.bigCircleR + objRef.bigCircleR) {
		const bigCircleArea = Math.PI * Math.pow(objRef.bigCircleR, 2);
		const smallCircleArea = Math.PI * Math.pow(this.bigCircleR, 2);
		const afterCircleArea = bigCircleArea + smallCircleArea;
		if (this.bigCircleR < objRef.bigCircleR) {
		  objRef.bigCircleRMin = objRef.bigCircleR;
		  objRef.bigCircleRMax = Math.sqrt(afterCircleArea / Math.PI);
		  objRef.smallCircleR = this.bigCircleR;
		  objRef.smallCircleOriginH = this.bigCircleOriginH;
		  objRef.smallCircleOriginK = this.bigCircleOriginK;
		  objRef.mousedownCoords = this.mousedownCoords;

		  const distanceDiff = Math.max(distance - objRef.bigCircleRMax + objRef.smallCircleR, 1);
		  
          objRef.drawSomething(distanceDiff, calculateAngle([objRef.bigCircleH, objRef.bigCircleK],[this.bigCircleH, this.bigCircleK]), 'join');

		  document.addEventListener("mousemove", objRef.mousemoveJoin, false);
		  document.addEventListener("mouseup", objRef.mouseupJoin, false);
		  document.removeEventListener("mousemove", this.mousemove, false);
		  document.removeEventListener("mouseup", this.mouseup, false);
		  this.lavaPath.parentNode.removeChild(this.lavaPath);
		} else {
		  objRef.bigCircleRMin = this.bigCircleR;
		  objRef.bigCircleRMax = Math.sqrt(afterCircleArea / Math.PI);
		  objRef.smallCircleR = objRef.bigCircleR;
		  objRef.smallCircleOriginH = objRef.bigCircleH;
		  objRef.smallCircleOriginK = objRef.bigCircleK;
		  objRef.bigCircleR = this.bigCircleR;
		  objRef.bigCircleH = this.bigCircleH;
		  objRef.bigCircleK = this.bigCircleK;
		  objRef.bigCircleOriginH = this.bigCircleOriginH;
		  objRef.bigCircleOriginK = this.bigCircleOriginK;
		  objRef.mousedownCoords = this.mousedownCoords;
		  const distanceDiff = Math.max(distance - objRef.bigCircleRMax + objRef.smallCircleR, 1);
		  objRef.drawSomething(distanceDiff, calculateAngle([objRef.bigCircleH, objRef.bigCircleK],[objRef.smallCircleOriginH, objRef.smallCircleOriginK]), 'join');
		  document.addEventListener("mousemove", objRef.mousemoveJoinAlt, false);
		  document.addEventListener("mouseup", objRef.mouseupJoinAlt, false);
		  document.removeEventListener("mousemove", this.mousemove, false);
		  document.removeEventListener("mouseup", this.mouseup, false);
		  this.lavaPath.parentNode.removeChild(this.lavaPath);
		}
		break;
	  }
	}
	this.reset();
    suppressPropagation(event);
  };
	
  this.mousemoveSeparate = (event) => {
	const coords = coordsGlobalToSVG(event.clientX, event.clientY);
	const distance = Math.sqrt(Math.pow(coords[0] - this.bigCircleH, 2) + Math.pow(coords[1] - this.bigCircleK, 2));
	if (distance > this.bigCircleR + this.joinCircleR * 2 + this.smallCircleR) {
	  const detached = new Blob(this.smallCircleR, coords[0], coords[1]);
	  detached.lavaPath.setAttributeNS(null, "class", "lavaPath joining");
	  document.addEventListener("mousemove", detached.mousemove, false);
	  document.addEventListener("mouseup", detached.mouseup, false);
	  document.removeEventListener("mousemove", this.mousemoveSeparate, false);
	  document.removeEventListener("mouseup", this.mouseupSeparate, false);
	  this.bigCircleR = this.bigCircleRMin;			
	  this.reset();
	} else {
	  const distanceDiff = Math.max(distance - this.originDistance, 1);
	  this.drawSomething(distanceDiff, calculateAngle([this.bigCircleH, this.bigCircleK], coords), 'separation');
	}
    suppressPropagation(event);
  };
  this.mousemoveJoin = (event) => {
    const coords = coordsGlobalToSVG(event.clientX, event.clientY);
	const distance = Math.sqrt(Math.pow(this.smallCircleOriginH + coords[0] - this.mousedownCoords[0] - this.bigCircleH, 2) + Math.pow(this.smallCircleOriginK + coords[1] - this.mousedownCoords[1] - this.bigCircleK, 2));

	if (distance > this.bigCircleRMin + this.smallCircleR) {
	  const detached = new Blob(this.smallCircleR, coords[0], coords[1]);
	  document.addEventListener("mousemove", detached.mousemove, false);
	  document.addEventListener("mouseup", detached.mouseup, false);
	  document.removeEventListener("mousemove", this.mousemoveJoin, false);
	  document.removeEventListener("mouseup", this.mouseupJoin, false);
	  this.lavaPath.setAttributeNS(null, "class", "lavaPath");
	  this.bigCircleR = this.bigCircleRMin;			
	  this.reset();
	} else {
	  const distanceDiff = Math.max(distance - this.bigCircleRMax + this.smallCircleR, 1);
	  this.drawSomething(distanceDiff, calculateAngle([this.bigCircleH, this.bigCircleK], [this.smallCircleOriginH + coords[0] - this.mousedownCoords[0], this.smallCircleOriginK + coords[1] - this.mousedownCoords[1]]), 'join');
	}
    suppressPropagation(event);
  };
  
  this.mousemoveJoinAlt = (event) => {
    const coords = coordsGlobalToSVG(event.clientX, event.clientY);

	this.bigCircleH = this.bigCircleOriginH + coords[0] - this.mousedownCoords[0];
	this.bigCircleK = this.bigCircleOriginK + coords[1] - this.mousedownCoords[1];

    const distance = Math.sqrt(Math.pow(this.bigCircleH - this.smallCircleOriginH, 2) + Math.pow(this.bigCircleK - this.smallCircleOriginK, 2));

	if (distance > this.bigCircleRMin + this.smallCircleR) {
	  const detached = new Blob(this.smallCircleR, this.smallCircleOriginH, this.smallCircleOriginK);
			
	  document.addEventListener("mousemove", this.mousemove, false);
	  document.addEventListener("mouseup", this.mouseup, false);
	  document.removeEventListener("mousemove", this.mousemoveJoinAlt, false);
	  document.removeEventListener("mouseup", this.mouseupJoinAlt, false);
	  this.bigCircleR = this.bigCircleRMin;			
	  this.reset();
	} else {
	  const distanceDiff = Math.max(distance - this.bigCircleRMax + this.smallCircleR, 1);
	  this.drawSomething(distanceDiff, calculateAngle([this.bigCircleH, this.bigCircleK], [this.smallCircleOriginH, this.smallCircleOriginK]), 'join');
	}
    suppressPropagation(event);
  };
  this.mouseup = (event) => {
    this.lavaPath.setAttributeNS(null, "class", "lavaPath");
	document.removeEventListener("mousemove", this.mousemove, false);
	document.removeEventListener("mouseup", this.mouseup, false);
    suppressPropagation(event);
  };
  this.mouseupSeparate = (event) => {
    const coords = coordsGlobalToSVG(event.clientX, event.clientY);
	this.collapse(coords);
	document.removeEventListener("mousemove", this.mousemoveSeparate, false);
	document.removeEventListener("mouseup", this.mouseupSeparate, false);
    suppressPropagation(event);
  };
  this.mouseupJoin = (event) => {
    const coords = coordsGlobalToSVG(event.clientX, event.clientY);
	this.join(coords);
	document.removeEventListener("mousemove", this.mousemoveJoin, false);
	document.removeEventListener("mouseup", this.mouseupJoin, false);
    suppressPropagation(event);
  };
  this.mouseupJoinAlt = (event) => {
    this.join(
      [
        this.smallCircleOriginH,
        this.smallCircleOriginK,
      ],
    );
	document.removeEventListener("mousemove", this.mousemoveJoinAlt, false);
	document.removeEventListener("mouseup", this.mouseupJoinAlt, false);
    suppressPropagation(event);
  };
  this.lavaPath.addEventListener("mousedown", this.mousedown, false);
  document.getElementsByTagName("svg")[0].appendChild(this.lavaPath);
  this.reset();
};

const suppressPropagation = (e) => {
  e.stopPropagation();
  e.preventDefault();
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

const getCircleYForX = (h, r, x) => Math.sqrt(Math.pow(r, 2) - Math.pow(x - h, 2));

const calculateAngle = (origin, point) => {
  const angle = Math.atan((point[1] - origin[1]) / (point[0] - origin[0])) / Math.PI * 180 + 90;
  return angle + ((point[0] < origin[0]) ? 180 : 0);
}

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
