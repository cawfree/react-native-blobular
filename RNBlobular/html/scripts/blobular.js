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

function Blob(radius, h, k)
{
	var self = this;

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
		
	/* Create lava path */	
	this.lavaPath = document.createElementNS(SVG_NS, "path");
	this.lavaPath.setAttributeNS(null, "class", "lavaPath");
	this.lavaPath.objRef = this;
	
	this.reset = function()
	{
		this.lavaPath.setAttributeNS(null, "transform", "translate(" + this.bigCircleH + "," + this.bigCircleK + ")");
		var lavaPathD = "m 0 " + -this.bigCircleR + " A " + this.bigCircleR + " " + this.bigCircleR + " 0 1 1 0 " + this.bigCircleR;
		lavaPathD += "A " + this.bigCircleR + " " + this.bigCircleR + " 0 1 1 0 " + -this.bigCircleR;
		
		this.lavaPath.setAttribute("d", lavaPathD);
	};
	
	this.drawSeparation = function(distance, angle)
	{
		this.lavaPath.setAttributeNS(null, "transform", "translate(" + this.bigCircleH + "," + this.bigCircleK + ") rotate(" + angle + ",0,0)");
		
		this.smallCircleK = 0 - this.bigCircleRMax + this.smallCircleR - distance;
		
		this.joinCircleR = VISCOSITY;
		var finalK = 0 - this.bigCircleRMin - this.joinCircleR * 2 - this.smallCircleR;
		var startK = 0 - this.bigCircleRMax + this.smallCircleR - 1;
		var differenceK = startK - finalK;
		var currDifferenceK = this.smallCircleK - finalK;
		var differencePercentage = currDifferenceK / differenceK;
		this.bigCircleR = this.bigCircleRMin + (this.bigCircleRMax - this.bigCircleRMin) * differencePercentage;

		var triangleA = this.bigCircleR + this.joinCircleR; // Side a
		var triangleB = this.smallCircleR + this.joinCircleR; // Side b
		var triangleC = Math.abs(this.smallCircleK - 0); // Side c
		var triangleP = (triangleA + triangleB + triangleC) / 2; // Triangle half perimeter
		var triangleArea = Math.sqrt(Math.abs(triangleP * (triangleP - triangleA) * (triangleP - triangleB) * (triangleP - triangleC))); // Triangle area
		
		if (triangleC >= triangleA)
		{
			var triangleH = 2 * triangleArea / triangleC; // Triangle height
			var triangleD = Math.sqrt(Math.pow(triangleA, 2) - Math.pow(triangleH, 2)); // Big circle bisection of triangleC
		}
		else
		{
			var triangleH = 2 * triangleArea / triangleA; // Triangle height
			var triangleD = Math.sqrt(Math.pow(triangleC, 2) - Math.pow(triangleH, 2)); // Small circle bisection of triangleA
		}

		var bigCircleTan = triangleH / triangleD;
		var bigCircleAngle = Math.atan(bigCircleTan);
		var bigCircleSin = Math.sin(bigCircleAngle);
		var bigCircleIntersectX = bigCircleSin * this.bigCircleR;
		var bigCircleCos = Math.cos(bigCircleAngle);
		var bigCircleIntersectY = bigCircleCos * this.bigCircleR;

		var joinCircleH = 0 + bigCircleSin * (this.bigCircleR + this.joinCircleR);
		var joinCircleK = 0 - bigCircleCos * (this.bigCircleR + this.joinCircleR);

		var coord1X = 0 - bigCircleIntersectX;
		var coord1Y = 0 - bigCircleIntersectY;
		var coord2X = 0 + bigCircleIntersectX;
		var coord2Y = 0 - bigCircleIntersectY;

		var smallCircleTan = (this.smallCircleK - joinCircleK) / (this.smallCircleH - joinCircleH);
		var smallCircleAngle = Math.atan(smallCircleTan);
		var smallCircleIntersectX = joinCircleH - Math.cos(smallCircleAngle) * (this.joinCircleR);
		var smallCircleIntersectY = joinCircleK - Math.sin(smallCircleAngle) * (this.joinCircleR);

		var lavaPathD = "M " + coord1X + " " + coord1Y + " A " + this.bigCircleR + " " + this.bigCircleR + " 0 1 0 " + coord2X + " " + coord2Y;
		
		if (joinCircleH - this.joinCircleR <= 0 && this.smallCircleK < joinCircleK)
		{
			var crossOverY = getCircleYForX(joinCircleH, this.joinCircleR, 0);
			
			lavaPathD += "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 0 " + (joinCircleK + crossOverY);
			lavaPathD += "m 0 -" + (crossOverY * 2);
		}

		lavaPathD += "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 " + smallCircleIntersectX + " " + smallCircleIntersectY;

		var largeArcFlag = 1;
		
		if (joinCircleK < this.smallCircleK)
		{
			largeArcFlag = 0;
		}

		lavaPathD += "a " + this.smallCircleR + " " + this.smallCircleR + " 0 " + largeArcFlag + " 0 " + ((smallCircleIntersectX - 0) * -2) + " 0";
		
		if (joinCircleH - this.joinCircleR <= 0 && this.smallCircleK < joinCircleK)
		{
			lavaPathD += "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 0 " + (joinCircleK - crossOverY);
			lavaPathD += "m 0 " + (crossOverY * 2);
		}

		lavaPathD += "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 " + coord1X + " " + coord1Y;

		lavaPathD += "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 " + coord1X + " " + coord1Y;

		this.lavaPath.setAttribute("d", lavaPathD);
	};
	
	this.drawJoin = function(distance, angle)
	{
		this.lavaPath.setAttributeNS(null, "class", "lavaPath joining");
		this.lavaPath.setAttributeNS(null, "transform", "translate(" + this.bigCircleH + "," + this.bigCircleK + ") rotate(" + angle + ",0,0)");
		
		this.smallCircleK = 0 - this.bigCircleRMax + this.smallCircleR - distance;

		this.joinCircleRMin = 1;
		this.joinCircleRMax = 200;

		var startK = 0 - this.bigCircleRMin - this.smallCircleR;
		var finalK = 0 - this.bigCircleRMax + this.smallCircleR - 1;
		var differenceK = startK - finalK;
		var currDifferenceK = this.smallCircleK - finalK;
		var differencePercentage = currDifferenceK / differenceK;
		this.joinCircleR = this.joinCircleRMax - (this.joinCircleRMax - this.joinCircleRMin) * differencePercentage;
		this.bigCircleR = this.bigCircleRMax - (this.bigCircleRMax - this.bigCircleRMin) * differencePercentage;

		var triangleA = this.bigCircleR + this.joinCircleR; // Side a
		var triangleB = this.smallCircleR + this.joinCircleR; // Side b
		var triangleC = Math.abs(this.smallCircleK); // Side c
		var triangleP = (triangleA + triangleB + triangleC) / 2; // Triangle half perimeter
		var triangleArea = Math.sqrt(triangleP * (triangleP - triangleA) * (triangleP - triangleB) * (triangleP - triangleC)); // Triangle area

		if (triangleC >= triangleA)
		{
			var triangleH = 2 * triangleArea / triangleC; // Triangle height
			var triangleD = Math.sqrt(Math.pow(triangleA, 2) - Math.pow(triangleH, 2)); // Big circle bisection of triangleC
		}
		else
		{
			var triangleH = 2 * triangleArea / triangleA; // Triangle height
			var triangleD = Math.sqrt(Math.pow(triangleC, 2) - Math.pow(triangleH, 2)); // Small circle bisection of triangleA
		}
		
		var bigCircleTan = triangleH / triangleD;
		var bigCircleAngle = Math.atan(bigCircleTan);
		var bigCircleSin = Math.sin(bigCircleAngle);
		var bigCircleIntersectX = bigCircleSin * this.bigCircleR;
		var bigCircleCos = Math.cos(bigCircleAngle);
		var bigCircleIntersectY = bigCircleCos * this.bigCircleR;

		var joinCircleH = bigCircleSin * (this.bigCircleR + this.joinCircleR);
		var joinCircleK = -bigCircleCos * (this.bigCircleR + this.joinCircleR);

		var coord1X = -bigCircleIntersectX;
		var coord1Y = -bigCircleIntersectY;
		var coord2X = bigCircleIntersectX;
		var coord2Y = -bigCircleIntersectY;

		var smallCircleTan = (this.smallCircleK - joinCircleK) / (this.smallCircleH - joinCircleH);
		var smallCircleAngle = Math.atan(smallCircleTan);
		var smallCircleIntersectX = joinCircleH - Math.cos(smallCircleAngle) * (this.joinCircleR);
		var smallCircleIntersectY = joinCircleK - Math.sin(smallCircleAngle) * (this.joinCircleR);

		var lavaPathD = "M " + coord1X + " " + coord1Y + " A " + this.bigCircleR + " " + this.bigCircleR + " 0 1 0 " + coord2X + " " + coord2Y;
		
		if (joinCircleH - this.joinCircleR <= 0 && this.smallCircleK < joinCircleK)
		{
			var crossOverY = getCircleYForX(joinCircleH, this.joinCircleR, 0);
			
			lavaPathD += "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 0 " + (joinCircleK + crossOverY);
			lavaPathD += "m 0 -" + (crossOverY * 2);
		}

		lavaPathD += "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 " + smallCircleIntersectX + " " + smallCircleIntersectY;

		var largeArcFlag = 1;
		
		if (joinCircleK < this.smallCircleK)
		{
			largeArcFlag = 0;
		}

		lavaPathD += "a " + this.smallCircleR + " " + this.smallCircleR + " 0 " + largeArcFlag + " 0 " + (smallCircleIntersectX * -2) + " 0";
		
		if (joinCircleH - this.joinCircleR <= 0 && this.smallCircleK < joinCircleK)
		{
			lavaPathD += "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 0 " + (joinCircleK - crossOverY);
			lavaPathD += "m 0 " + (crossOverY * 2);
		}

		lavaPathD += "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 " + coord1X + " " + coord1Y;

		lavaPathD += "A " + this.joinCircleR + " " + this.joinCircleR + " 0 0 1 " + coord1X + " " + coord1Y;

		this.lavaPath.setAttribute("d", lavaPathD);
	};
	
	this.collapse = function(coords)
	{
		var increment = VISCOSITY / 4;
		var newK = this.smallCircleK + increment;
		
		if (newK > -this.bigCircleR + this.smallCircleR - 1)
		{
			this.bigCircleR = this.bigCircleRMax;
			this.reset();
		}
		else
		{
			var distance = -newK - (this.bigCircleRMax - this.smallCircleR);
			var angle = calculateAngle([this.bigCircleH, this.bigCircleK], coords);
			
			this.drawSeparation(distance, angle);
			setTimeout(function()
				{
					self.collapse(coords);
				}, 25);
		}
	}
	
	this.join = function(coords)
	{
		var increment = 20;
		var newK = this.smallCircleK + increment;
		
		if (newK > -this.bigCircleR + this.smallCircleR - 1)
		{
			this.bigCircleR = this.bigCircleRMax;
			this.lavaPath.setAttributeNS(null, "class", "lavaPath");
			this.reset();
		}
		else
		{
			var distance = -newK - (this.bigCircleRMax - this.smallCircleR);
			var angle = calculateAngle([this.bigCircleH, this.bigCircleK], coords);
			
			this.drawJoin(distance, angle);
			setTimeout(function()
				{
					self.join(coords);
				}, 25);
		}
	}
	
	this.mousedown = function(event)
	{
		self.mousedownCoords = coordsGlobalToSVG(event.clientX, event.clientY);

		self.bigCircleOriginH = self.bigCircleH;
		self.bigCircleOriginK = self.bigCircleK;

		self.originDistance = Math.sqrt(Math.pow(self.mousedownCoords[0] - self.bigCircleH, 2) + Math.pow(self.mousedownCoords[1] - self.bigCircleK, 2));
		
		self.smallCircleR = self.bigCircleR - self.originDistance;

		 /* If click in centre, move blob instead of separating */
		if (self.originDistance < 20)
		{
			document.addEventListener("mousemove", self.mousemove, false);
			document.addEventListener("mouseup", self.mouseup, false);
		}
		else
		{
			var bigCircleArea = Math.PI * Math.pow(self.bigCircleR, 2);
			var smallCircleArea = Math.PI * Math.pow(self.smallCircleR, 2);
			var afterCircleArea = bigCircleArea - smallCircleArea;
			
			self.bigCircleRMax = self.bigCircleR;
			self.bigCircleRMin = Math.sqrt(afterCircleArea / Math.PI);
			
			document.addEventListener("mousemove", self.mousemoveSeparate, false);
			document.addEventListener("mouseup", self.mouseupSeparate, false);
		}

		event.stopPropagation();
		event.preventDefault();
	};
	
	this.mousemove = function(event)
	{
		var coords = coordsGlobalToSVG(event.clientX, event.clientY);
		
		self.lavaPath.setAttributeNS(null, "class", "lavaPath");

		self.bigCircleH = self.bigCircleOriginH + coords[0] - self.mousedownCoords[0];
		self.bigCircleK = self.bigCircleOriginK + coords[1] - self.mousedownCoords[1];
		
			var paths = document.getElementsByTagName("path");

			for (var i = 0; i < paths.length; i++)
			{
				var objRef = paths[i].objRef;

				var distance = Math.sqrt(Math.pow(self.bigCircleH - objRef.bigCircleH, 2) + Math.pow(self.bigCircleK - objRef.bigCircleK, 2))

				if (paths[i] != self.lavaPath && distance < self.bigCircleR + objRef.bigCircleR)
				{
					var bigCircleArea = Math.PI * Math.pow(objRef.bigCircleR, 2);
					var smallCircleArea = Math.PI * Math.pow(self.bigCircleR, 2);
					var afterCircleArea = bigCircleArea + smallCircleArea;

					if (self.bigCircleR < objRef.bigCircleR)
					{
						objRef.bigCircleRMin = objRef.bigCircleR;
						objRef.bigCircleRMax = Math.sqrt(afterCircleArea / Math.PI);
						objRef.smallCircleR = self.bigCircleR;
						objRef.smallCircleOriginH = self.bigCircleOriginH;
						objRef.smallCircleOriginK = self.bigCircleOriginK;
						objRef.mousedownCoords = self.mousedownCoords;

						var distanceDiff = distance - objRef.bigCircleRMax + objRef.smallCircleR;

						if (distanceDiff < 1)
						{
							distanceDiff = 1;
						}

						objRef.drawJoin(distanceDiff, calculateAngle([objRef.bigCircleH, objRef.bigCircleK],[self.bigCircleH, self.bigCircleK]));

						document.addEventListener("mousemove", objRef.mousemoveJoin, false);
						document.addEventListener("mouseup", objRef.mouseupJoin, false);
						document.removeEventListener("mousemove", self.mousemove, false);
						document.removeEventListener("mouseup", self.mouseup, false);

						self.lavaPath.parentNode.removeChild(self.lavaPath);
					}
					else
					{
						objRef.bigCircleRMin = self.bigCircleR;
						objRef.bigCircleRMax = Math.sqrt(afterCircleArea / Math.PI);
						objRef.smallCircleR = objRef.bigCircleR;
						objRef.smallCircleOriginH = objRef.bigCircleH;
						objRef.smallCircleOriginK = objRef.bigCircleK;
						objRef.bigCircleR = self.bigCircleR;
						objRef.bigCircleH = self.bigCircleH;
						objRef.bigCircleK = self.bigCircleK;
						objRef.bigCircleOriginH = self.bigCircleOriginH;
						objRef.bigCircleOriginK = self.bigCircleOriginK;
						objRef.mousedownCoords = self.mousedownCoords;

						var distanceDiff = distance - objRef.bigCircleRMax + objRef.smallCircleR;

						if (distanceDiff < 1)
						{
							distanceDiff = 1;
						}

						objRef.drawJoin(distanceDiff, calculateAngle([objRef.bigCircleH, objRef.bigCircleK],[objRef.smallCircleOriginH, objRef.smallCircleOriginK]));

						document.addEventListener("mousemove", objRef.mousemoveJoinAlt, false);
						document.addEventListener("mouseup", objRef.mouseupJoinAlt, false);
						document.removeEventListener("mousemove", self.mousemove, false);
						document.removeEventListener("mouseup", self.mouseup, false);

						self.lavaPath.parentNode.removeChild(self.lavaPath);
					}

					break;
				}
			}
		
		self.reset();

		event.stopPropagation();
		event.preventDefault();
	};
	
	this.mousemoveSeparate = function(event)
	{
		var coords = coordsGlobalToSVG(event.clientX, event.clientY);
		
		var distance = Math.sqrt(Math.pow(coords[0] - self.bigCircleH, 2) + Math.pow(coords[1] - self.bigCircleK, 2));

		if (distance > self.bigCircleR + self.joinCircleR * 2 + self.smallCircleR)
		{
			var detached = new Blob(self.smallCircleR, coords[0], coords[1]);
			detached.lavaPath.setAttributeNS(null, "class", "lavaPath joining");

			
			document.addEventListener("mousemove", detached.mousemove, false);
			document.addEventListener("mouseup", detached.mouseup, false);
			document.removeEventListener("mousemove", self.mousemoveSeparate, false);
			document.removeEventListener("mouseup", self.mouseupSeparate, false);

			this.bigCircleR = this.bigCircleRMin;			
			self.reset();
		}
		else
		{
			var distanceDiff = distance - self.originDistance;

			if (distanceDiff < 1)
			{
				distanceDiff = 1;
			}

			self.drawSeparation(distanceDiff, calculateAngle([self.bigCircleH, self.bigCircleK], coords));
		}

		event.stopPropagation();
		event.preventDefault();
	};
	
	this.mousemoveJoin = function(event)
	{
		var coords = coordsGlobalToSVG(event.clientX, event.clientY);
		
		var distance = Math.sqrt(Math.pow(self.smallCircleOriginH + coords[0] - self.mousedownCoords[0] - self.bigCircleH, 2) + Math.pow(self.smallCircleOriginK + coords[1] - self.mousedownCoords[1] - self.bigCircleK, 2));

		if (distance > self.bigCircleRMin + self.smallCircleR)
		{
			var detached = new Blob(self.smallCircleR, coords[0], coords[1]);
			
			document.addEventListener("mousemove", detached.mousemove, false);
			document.addEventListener("mouseup", detached.mouseup, false);
			document.removeEventListener("mousemove", self.mousemoveJoin, false);
			document.removeEventListener("mouseup", self.mouseupJoin, false);

			self.lavaPath.setAttributeNS(null, "class", "lavaPath");
			self.bigCircleR = self.bigCircleRMin;			
			self.reset();
		}
		else
		{
			var distanceDiff = distance - self.bigCircleRMax + self.smallCircleR;

			if (distanceDiff < 1)
			{
				distanceDiff = 1;
			}

			self.drawJoin(distanceDiff, calculateAngle([self.bigCircleH, self.bigCircleK], [self.smallCircleOriginH + coords[0] - self.mousedownCoords[0], self.smallCircleOriginK + coords[1] - self.mousedownCoords[1]]));
		}

		event.stopPropagation();
		event.preventDefault();
	};
	
	this.mousemoveJoinAlt = function(event)
	{
		var coords = coordsGlobalToSVG(event.clientX, event.clientY);

		self.bigCircleH = self.bigCircleOriginH + coords[0] - self.mousedownCoords[0];
		self.bigCircleK = self.bigCircleOriginK + coords[1] - self.mousedownCoords[1];
		
		var distance = Math.sqrt(Math.pow(self.bigCircleH - self.smallCircleOriginH, 2) + Math.pow(self.bigCircleK - self.smallCircleOriginK, 2));

		if (distance > self.bigCircleRMin + self.smallCircleR)
		{
			var detached = new Blob(self.smallCircleR, self.smallCircleOriginH, self.smallCircleOriginK);
			
			document.addEventListener("mousemove", self.mousemove, false);
			document.addEventListener("mouseup", self.mouseup, false);
			document.removeEventListener("mousemove", self.mousemoveJoinAlt, false);
			document.removeEventListener("mouseup", self.mouseupJoinAlt, false);

			self.bigCircleR = self.bigCircleRMin;			
			self.reset();
		}
		else
		{
			var distanceDiff = distance - self.bigCircleRMax + self.smallCircleR;

			if (distanceDiff < 1)
			{
				distanceDiff = 1;
			}

			self.drawJoin(distanceDiff, calculateAngle([self.bigCircleH, self.bigCircleK], [self.smallCircleOriginH, self.smallCircleOriginK]));
		}

		event.stopPropagation();
		event.preventDefault();
	};
	
	this.mouseup = function(event)
	{
		self.lavaPath.setAttributeNS(null, "class", "lavaPath");
		
		document.removeEventListener("mousemove", self.mousemove, false);
		document.removeEventListener("mouseup", self.mouseup, false);

		event.stopPropagation();
		event.preventDefault();
	};

	this.mouseupSeparate = function(event)
	{
		var coords = coordsGlobalToSVG(event.clientX, event.clientY);
		self.collapse(coords);
		
		document.removeEventListener("mousemove", self.mousemoveSeparate, false);
		document.removeEventListener("mouseup", self.mouseupSeparate, false);

		event.stopPropagation();
		event.preventDefault();
	};

	this.mouseupJoin = function(event)
	{
		var coords = coordsGlobalToSVG(event.clientX, event.clientY);
		self.join(coords);
		
		document.removeEventListener("mousemove", self.mousemoveJoin, false);
		document.removeEventListener("mouseup", self.mouseupJoin, false);

		event.stopPropagation();
		event.preventDefault();
	};

	this.mouseupJoinAlt = function(event)
	{
		self.join([self.smallCircleOriginH, self.smallCircleOriginK]);
		
		document.removeEventListener("mousemove", self.mousemoveJoinAlt, false);
		document.removeEventListener("mouseup", self.mouseupJoinAlt, false);

		event.stopPropagation();
		event.preventDefault();
	};

	this.lavaPath.addEventListener("mousedown", this.mousedown, false);
		
	document.getElementsByTagName("svg")[0].appendChild(this.lavaPath);
	
	this.reset();
};

function coordsGlobalToSVG(globalX, globalY)
{
	var svgCoords = [0, 0];
	var svg = document.getElementsByTagName("svg")[0];
	var viewBox = svg.viewBox.baseVal;
	var viewBoxWidth = viewBox.width;
	var viewBoxHeight = viewBox.height;
	var viewBoxRatio = viewBoxWidth / viewBoxHeight;
	var viewportSize = getViewportSize();
	var viewportRatio = viewportSize[0] / viewportSize[1];
	
	if (viewBoxRatio <= viewportRatio)
	{
		svgCoords[1] = globalY * (viewBoxHeight / viewportSize[1]);

		var viewBoxGlobalWidth = viewBoxWidth * (viewportSize[1] / viewBoxHeight);
		var viewBoxGlobalOriginX = (viewportSize[0] - viewBoxGlobalWidth) / 2;
		svgCoords[0] = (globalX - viewBoxGlobalOriginX) * (viewBoxHeight / viewportSize[1]);
	}
	else
	{
		svgCoords[0] = globalX * (viewBoxWidth / viewportSize[0]);

		var viewBoxGlobalHeight = viewBoxHeight * (viewportSize[0] / viewBoxWidth);		
		var viewBoxGlobalOriginY = (viewportSize[1] - viewBoxGlobalHeight) / 2;
		svgCoords[1] = (globalY - viewBoxGlobalOriginY) * (viewBoxWidth / viewportSize[0]);
	}
	
	return svgCoords;
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
