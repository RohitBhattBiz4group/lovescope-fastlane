import React from "react";
import { StyleSheet, View, Animated } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Matrics from "../config/appStyling/matrics";

interface NotificationSkeletonProps {
  count?: number;
}

const NotificationSkeleton: React.FC<NotificationSkeletonProps> = ({
  count = 6,
}) => {
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

  const renderSkeletonItem = (key: number) => (
    <View key={key} style={styles.notificationItem}>
      {/* Title skeleton */}
      <View style={styles.titleSkeleton}>
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

      {/* Content skeleton - 2 lines */}
      <View style={styles.contentSkeleton}>
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

      <View style={[styles.contentSkeleton, { width: "75%" }]}>
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

      {/* Time skeleton */}
      <View style={styles.timeSkeleton}>
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

  const items = Array.from({ length: count }).map((_, index) =>
    renderSkeletonItem(index),
  );

  return <View style={styles.container}>{items}</View>;
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Matrics.vs(0),
  },
  notificationItem: {
    paddingVertical: Matrics.vs(15),
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  titleSkeleton: {
    width: "60%",
    height: 18,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginBottom: Matrics.vs(8),
    overflow: "hidden",
  },
  contentSkeleton: {
    width: "100%",
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginBottom: Matrics.vs(4),
    overflow: "hidden",
  },
  timeSkeleton: {
    width: "20%",
    height: 10,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginTop: Matrics.vs(6),
    overflow: "hidden",
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

export default NotificationSkeleton;
