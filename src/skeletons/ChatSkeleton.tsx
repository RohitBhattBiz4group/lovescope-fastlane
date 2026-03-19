import React from "react";
import { StyleSheet, View, Animated } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Matrics from "../config/appStyling/matrics";

interface ChatSkeletonProps {
  count?: number;
}

const ChatSkeleton: React.FC<ChatSkeletonProps> = ({ count = 8 }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false, // Can't use native driver with translateX for gradient
      }),
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });

  const renderBubbleRow = (key: number, alignRight: boolean) => (
    <View
      key={key}
      style={[
        styles.rowContainer,
        alignRight ? styles.rowRight : styles.rowLeft,
      ]}
    >
      <View style={styles.bubbleSkeleton}>
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(255, 255, 255, 0)",
              "rgba(255, 255, 255, 0.7)",
              "rgba(255, 255, 255, 0.5)",
              "rgba(255, 255, 255, 0)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      </View>
    </View>
  );

  const rows = Array.from({ length: count }).map((_, index) =>
    renderBubbleRow(index, index % 2 === 1),
  );

  return <View style={styles.container}>{rows}</View>;
};

const styles = StyleSheet.create({
  // Match messagesContainer from chat screens
  container: {
    paddingHorizontal: Matrics.s(16),
    paddingTop: Matrics.vs(0),
    paddingBottom: Matrics.vs(15),
  },
  rowContainer: {
    flexDirection: "row",
    marginBottom: Matrics.vs(18), // same as messageContainer marginBottom
  },
  rowLeft: {
    justifyContent: "flex-start",
  },
  rowRight: {
    justifyContent: "flex-end",
  },
  // Approximate messageBubble (maxWidth 85%, radius 12)
  bubbleSkeleton: {
    width: "80%",
    height: Matrics.vs(40),
    borderRadius: Matrics.s(12),
    backgroundColor: "#F5F6F8", // Simple light gray (consistent with other skeletons)
    overflow: "hidden", // Clip the shimmer effect to bubble shape
  },
  shimmerOverlay: {
    width: "100%",
    height: "100%",
  },
  shimmerGradient: {
    width: 350,
    height: "100%",
  },
});

export default ChatSkeleton;
