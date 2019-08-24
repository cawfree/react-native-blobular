import React from 'react';
import {
  Animated,
  PanResponder,
  View,
} from 'react-native';
import PropTypes from 'prop-types';
import {
  Path,
} from 'react-native-svg';

class Blob extends React.Component {
  static getDefaultLava = bigCircleR => ([
    `m 0 ${-bigCircleR} A ${bigCircleR} ${bigCircleR} 0 1 1 0 ${bigCircleR}`,
    `A ${bigCircleR} ${bigCircleR} 0 1 1 0 ${-bigCircleR}`,
  ])
    .join('');
  constructor(props) {
    super(props);
    const {
      radius: bigCircleR,
      h,
      k,
      viscosity,
      minRadius: smallCircleR,
    } = props;
    this.state = {
      bigCircleR,
      bigCircleH: h,
      bigCircleK: k,
      bigCircleOriginH: h,
      bigCircleOriginK: k,
      joinCircleR: viscosity,
      smallCircleR,
      smallCircleH: 0,
      smallCircleK: 0 - bigCircleR + smallCircleR - 1,
      touchCoords = [
        h,
        k,
      ],
      panResponder: PanResponder.create(
        {
          onStartShouldSetPanResponder: (e, gestureState) => true,
          onPanResponderMove: (e, gestureState) => {
            const { locationX, locationY } = e.nativeEvent;
            console.log(locationX, locationY);
          },
          onPanResponderRelease: (e, gestureState) => {
            console.log('up');
          },
          onPanResponderTerminate: (e, gestureState) => {
            console.log('another up');
          },
        },
      ),
    };
  }
  reset = () => {
    const { bigCircleR } = this.state;
    const { lava } = this.refs;
    lava
      .setNativeProps(
        {
          d: Blob
            .getDefaultLava(
              bigCircleR,
            ),
        },
      );
  };
  getCircleYFromX = (h, k, r, x) => Math.sqrt(
    Math.pow(
      r,
      2,
    ) - Math.pow(
      x - h,
      2,
    ),
  );
  drawSeparation = (distance, rotation) => {
    const { viscosity } = this.props;
    const { lava } = this.refs;
    
    this.state.smallCircleK = 0 - this.state.bigCircleRMax + this.state.smallCircleR - distance;
    this.state.joinCircleR = viscosity;
    
    const startK = 0 - this.state.bigCircleRMax + this.state.smallCircleR - 1;
    const finalK = 0 - this.state.bigCircleRMin - this.state.joinCircleR * 2 - this.state.smallCircleR;
    const differenceK = startK - finalK;

    const currDifferenceK = this.state.smallCircleK - finalK;
    const differencePercentage = currDifferenceK / differenceK;

    this.state.bigCircleR = this.state.bigCircleRMin + (this.state.bigCircleRMax - this.state.bigCircleRMin) * differencePercentage;

    const triangleA = this.state.bigCircleR + this.state.joinCircleR;
    const triangleB = this.state.smallCircleR + this.state.joinCircleR;
    const triangleC = Math.abs(
      this.state.smallCircleK,
    );
    const triangleP = (triangleA + triangleB + triangleC ) * 0.5;
    const triangleArea = Math.sqrt(
      Math.abs(
        triangleP * (triangleP - triangleA) * (triangleP - triangleB) * (triangleP - triangleC),
      ),
    );
    const triangleCIsBigger = triangleC >= triangleA;
    const triangleH = triangleCIsBigger ? (
      2 * triangleArea / triangleC
    ) : (
      2 * triangleArea / triangleA
    );
    const triangleD = triangleCIsBigger ? (
      Math.sqrt(
        Math.pow(
          triangleA,
          2,
        ) - Math.pow(
          triangleH,
          2,
        )
      )
    ) : (
      Math.sqrt(
        Math.pow(
          triangleC,
          2,
        ) - Math.pow(
          triangleH,
          2,
        ),
      )
    );

    const bigCircleTan = triangleH / triangleD;
    const bigCircleAngle = Math.atan(bigCircleTan);
    const bigCircleSin = Math.sin(bigCircleAngle);
    const bigCircleIntersectX = bigCircleSin * this.state.bigCircleR;
    const bigCircleCos = Math.cos(bigCircleAngle);
    const bigCircleIntersectY = bigCircleCos * this.state.bigCircleR;

    const joinCircleH = bigCircleSin + (this.state.bigCircleR + this.state.joinCircleR);
    const joinCircleK = -bigCircleCos + (this.state.bigCircleR + this.state.joinCircleR);

    const coord1X = -1 * bigCircleIntersectX;
    const coord1Y = -1 * bigCircleIntersectY;
    const coord2X = bigCircleIntersectX;
    const coord2Y = -1 * bigCircleIntersectY;

    const smallCircleTan = (this.state.smallCircleK - joinCircleK) / (this.state.smallCircleH - joinCircleH);

    const smallCircleAngle = Math.atan(smallCircleTan);
    const smallCircleIntersectX = joinCircleH - Math.cos(smallCircleAngle) * this.state.joinCircleR;
    const smallCircleIntersectY = joinCircleK - Math.sin(smallCircleAngle) * this.state.joinCircleR;
    
    const shouldCrossOver = joinCircleH - this.state.joinCircleR <= 0 && this.state.smallCircleK < joinCircleK;

    const crossOverY = this.getCircleYFromX(
      joinCircleH,
      joinCircleK,
      this.state.joinCircleR,
      0,
    );

    const largeArcFlag = (joinCircleK < this.state.smallCircleK) ? 0 : 1;
    const isOverlap = joinCircleH - this.state.joinCircleR <= 0 && this.state.smallCircleK < joinCircleK;

    lava.setNativeProps(
      {
        x: this.state.bigCircleH,
        y: this.state.bigCircleK,
        rotation,
        d: [
          `M ${coord1X} ${coord1Y} A ${this.state.bigCircleR} ${this.state.bigCircleR} 0 1 0 ${coord2X} ${coord2Y}`,
          (!!shouldCrossOver) && (
            `A ${this.state.joinCircleR} ${this.state.joinCircleR} 0 0 1 0 ${joinCircleK + crossOverY}`
          ),
          (!!shouldCrossOver) && (
            `m 0 -${crossOverY * 2}`
          ),
          `A ${this.state.joinCircleR} ${this.state.joinCircleR} 0 0 1 ${smallCircleIntersectX} ${smallCircleIntersectY}`,
          `a ${this.state.smallCircleR} ${this.state.smallCircleR} 0 ${largeArcFlag} 0 ${smallCircleIntersectX * -2} 0`,
          (!!isOverlap) && (
            `A ${this.state.joinCircleR} ${this.state.joinCircleR} 0 0 1 0 ${joinCircleK - crossOverY}`
          ),
          (!!isOverlap) && (
            `m 0 ${crossOverY * 2}`
          ),
          `A ${this.state.joinCircleR} ${this.state.joinCircleR} 0 0 1 ${coord1X} ${coord1Y}`,
          // TODO: Why a duplicate?
          `A ${this.state.joinCircleR} ${this.state.joinCircleR} 0 0 1 ${coord1X} ${coord1Y}`,
        ]
          .filter(e => !!e)
          .join(''),
      },
    );
  };
  // TODO: need to extract commonalities
  drawJoin = (distance, rotation) => {
    const { lava } = this.refs;
    lava
      .setNativeProps(
        {
          x: this.state.bigCircleH,
          y: this.state.bigCircleK,
          rotation,
        },
      );


    this.state.smallCircleK = -1 * this.state.bigCircleRMax + this.state.smallCircleR - distance;

    this.state.joinCircleRMin = 1;
    this.state.joinCircleRMax = 200;

    const startK = -this.state.bigCircleRMin - this.state.smallCircleR;
    const finalK = -this.state.bigCircleRMax + this.state.smallCircleR - 1;
    const differenceK = startK - finalK;
    const currDifferenceK = this.state.smallCircleK - finalK;
    const differencePercentage = currDifferenceK / differenceK;

    this.state.joinCircleR = this.state.joinCircleRMax - (this.state.joinCircleRMax - this.state.joinCircleRMin) * differencePercentage;
    this.state.bigCircleR = this.state.bigCircleRMax - (this.state.bigCircleRMax - this.state.bigCircleRMin) * differencePercentage;

    const triangleA = this.state.bigCircleR + this.state.joinCircleR;
    const triangleB = this.state.smallCircleR + this.state.joinCircleR;
    const triangleC = Math.abs(this.state.smallCircleK);
    const triangleP = (triangleA + triangleB + triangleC) * 0.5;
    const triangleArea = Math.sqrt(
        triangleP * (triangleP - triangleA) * (triangleP - triangleB) * (triangleP - triangleC)
    );

    const triangleCIsBigger = triangleC >= triangleA;
    const triangleH = triangleCIsBigger ? (
      2 * triangleArea / triangleC
    ) : (
      2 * triangleArea / triangleA
    );
    const triangleD = triangleCIsBigger ? (
      Math.sqrt(
        Math.pow(
          triangleA,
          2,
        ) - Math.pow(
          triangleH,
          2,
        )
      )
    ) : (
      Math.sqrt(
        Math.pow(
          triangleC,
          2,
        ) - Math.pow(
          triangleH,
          2,
        ),
      )
    );

    const bigCircleTan = triangleH / triangleD;
    const bigCircleAngle = Math.atan(bigCircleTan);
    const bigCircleSin = Math.sin(bigCircleAngle);
    const bigCircleIntersectX = bigCircleSin * this.state.bigCircleR;
    const bigCircleCos = Math.cos(bigCircleAngle);
    const bigCircleIntersectY = bigCircleCos * this.state.bigCircleR;

    const joinCircleH = bigCircleSin + (this.state.bigCircleR + this.state.joinCircleR);
    const joinCircleK = -bigCircleCos + (this.state.bigCircleR + this.state.joinCircleR);

    const coord1X = -1 * bigCircleIntersectX;
    const coord1Y = -1 * bigCircleIntersectY;
    const coord2X = bigCircleIntersectX;
    const coord2Y = -1 * bigCircleIntersectY;

    const smallCircleTan = (this.state.smallCircleK - joinCircleK) / (this.state.smallCircleH - joinCircleH);

    const smallCircleAngle = Math.atan(smallCircleTan);
    const smallCircleIntersectX = joinCircleH - Math.cos(smallCircleAngle) * this.state.joinCircleR;
    const smallCircleIntersectY = joinCircleK - Math.sin(smallCircleAngle) * this.state.joinCircleR;
    const shouldCrossOver = joinCircleH - this.state.joinCircleR <= 0 && this.state.smallCircleK < joinCircleK;

    const crossOverY = this.getCircleYFromX(
      joinCircleH,
      joinCircleK,
      this.state.joinCircleR,
      0,
    );

    const largeArcFlag = (joinCircleK < this.state.smallCircleK) ? 0 : 1;
    const isOverlap = joinCircleH - this.state.joinCircleR <= 0 && this.state.smallCircleK < joinCircleK;

    lava.setNativeProps(
      {
        x: this.state.bigCircleH,
        y: this.state.bigCircleK,
        rotation,
        d: [
          `M ${coord1X} ${coord1Y} A ${this.state.bigCircleR} ${this.state.bigCircleR} 0 1 0 ${coord2X} ${coord2Y}`,
          (!!shouldCrossOver) && (
            `A ${this.state.joinCircleR} ${this.state.joinCircleR} 0 0 1 0 ${joinCircleK + crossOverY}`
          ),
          (!!shouldCrossOver) && (
            `m 0 -${crossOverY * 2}`
          ),
          `A ${this.state.joinCircleR} ${this.state.joinCircleR} 0 0 1 ${smallCircleIntersectX} ${smallCircleIntersectY}`,
          `a ${this.state.smallCircleR} ${this.state.smallCircleR} 0 ${largeArcFlag} 0 ${smallCircleIntersectX * -2} 0`,
          (!!isOverlap) && (
            `A ${this.state.joinCircleR} ${this.state.joinCircleR} 0 0 1 0 ${joinCircleK - crossOverY}`
          ),
          (!!isOverlap) && (
            `m 0 ${crossOverY * 2}`
          ),
          `A ${this.state.joinCircleR} ${this.state.joinCircleR} 0 0 1 ${coord1X} ${coord1Y}`,
          // TODO: Why a duplicate?
          `A ${this.state.joinCircleR} ${this.state.joinCircleR} 0 0 1 ${coord1X} ${coord1Y}`,
        ]
          .filter(e => !!e)
          .join(''),
      },
    );
  };
  collapse = (coords = []) => {
    const { viscosity } = this.props;
    const increment = viscosity * 0.25;
    const newK = this.state.smallCircleK + this.state.smallCircleR - 1;
    if (newK > -this.state.bigCircleR + this.state.smallCircleR - 1) {
      this.state.bigCircleR = this.state.bigCircleRMax;
      this.reset();
    } else {
      const distance = -newK - (this.state.bigCircleRMax - this.state.smallCircleR);
      const angle = this.calculateAngle(
        [
          this.state.bigCircleH,
          this.state.bigCircleK,
        ],
        coords,
      );
      this.drawJoin(
        distance,
        angle,
      );
      console.log('would re draw here with setTimeout here');
    }
  };
  join = (coords = []) => {
    const increment = 20;
    const newK = this.state.smallCircleK + increment;
    if (newK > -this.state.bigCircleR + this.state.smallCircleR - 1) {
      this.state.bigCircleR = this.state.bigCircleRMax;
      this.reset();
    } else {
      const distance = -newK - (this.state.bigCircleRMax - this.state.smallCircleR);
      const angle = calculateAngle(
        [
          this.state.bigCircleH,
          this.state.bigCircleK,
        ],
        coords,
      );
      this.drawJoin(
        distance,
        angle,
      ),
      console.log('should redraw here');
    }
  };
  calculateAngle = (origin, point) => {
    const tan = (point[1] - origin[1]) / (point[0] - origin[0]);
	const angle = Math.atan(tan) / Math.PI * 180 + 90;
	return angle + ((point[0] < origin[0]) ? 180 : 0);
  };
  onPanResponderGrant = (e) => {
    const { } = this.props;
    // TODO:
    const { x, y } = e;
    this.state.touchCoords = [
      x,
      y,
    ];
    this.state.bigCircleOriginH = this.state.bigCircleH;
    this.state.bigCircleOriginK = this.state.bigCircleK;

    this.state.originDistance = Math.sqrt(
      Math.pow(
        this.state.touchCoords[0] - this.state.bigCircleH,
        2,
      ) + Math.pow(
        this.state.touchCoords[1] - this.state.bigCircleK,
        2,
      ),
    );
    
    this.state.smallCircleR = this.state.bigCircleR - this.state.originDistance;

    if (this.originDistance < 20) {
      
    } else {

    }

  };
  componentDidMount() {
    this.reset();
  }
  render() {
    const { panResponder } = this.state;
    return (
      <React.Fragment>
        <Path
          ref="lava"
          fill="red"
        />
      </React.Fragment>
    );
  }
}

Blob.propTypes = {
  radius: PropTypes.number,
  h: PropTypes.number,
  k: PropTypes.number,
  viscosity: PropTypes.number,
  minRadius: PropTypes.number, //smallCircleR
};

Blob.defaultProps = {
  radius: 200,
  h: 400,
  k: 300,
  viscosity: 75,
  minRadius: 50,
};

export default Blob;
