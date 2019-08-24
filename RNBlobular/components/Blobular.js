import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Animated,
  Dimensions,
  Text,
  StyleSheet,
  PanResponder,
} from 'react-native';
import Svg, {

} from 'react-native-svg';

import Blob from './Blob';

const styles = StyleSheet
  .create(
    {
    },
  );

class Blobular extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      indicatorX: undefined,
      indicatorY: undefined,
      panResponder: PanResponder.create(
        {
          onStartShouldSetPanResponder: (e, gestureState) => true,
          onPanResponderGrant: (evt, gestureState) => {
            
          },
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
  render() {
    const {
      width,
      height,
    } = this.props;
    const {
      panResponder,
    } = this.state;
    return (
      <View
        {...panResponder.panHandlers}
        style={[
          {
            width,
            height,
          },
        ]}
      >
        <Svg
          width={width}
          height={height}
        >
          <Blob
          />
        </Svg>
      </View>
    );
  }
}

const {
  width: screenWidth,
  height: screenHeight,
} = Dimensions.get('window');

Blobular.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
};

Blobular.defaultProps = {
  width: screenWidth,
  height: screenHeight,
};

export default Blobular;
