import React from "react";
import { StyleSheet, View, Animated } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Matrics from "../config/appStyling/matrics";

interface QuizCardSkeletonProps {
  count?: number;
}

const QuizCardSkeleton: React.FC<QuizCardSkeletonProps> = ({ count = 5 }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });

  const renderSkeletonCard = (key: number, alignRight: boolean) => (
    <View
      key={key}
      style={[styles.cardContainer, alignRight && styles.cardContainerSent]}
    >
      <View style={[styles.card, alignRight && styles.cardSent]}>
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

        {/* Info row 1 (user) */}
        <View style={styles.infoRow}>
          <View style={styles.iconSkeleton}>
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
          <View style={styles.infoTextSkeleton}>
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

        {/* Info row 2 (questions) */}
        <View style={styles.infoRow}>
          <View style={styles.iconSkeleton}>
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
          <View style={[styles.infoTextSkeleton, { width: "35%" }]}>
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

        {/* Button skeleton */}
        <View
          style={[
            styles.buttonSkeleton,
            alignRight && styles.buttonSkeletonSent,
          ]}
        >
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

      {/* Time skeleton */}
      <View
        style={[styles.timeSkeleton, alignRight && styles.timeSkeletonSent]}
      >
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

  const cards = Array.from({ length: count }).map((_, index) =>
    renderSkeletonCard(index, index % 2 === 1),
  );

  return <View style={styles.container}>{cards}</View>;
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Matrics.s(16),
    paddingTop: Matrics.vs(10),
    paddingBottom: Matrics.vs(10),
  },
  cardContainer: {
    marginBottom: Matrics.vs(10),
    alignItems: "flex-start",
  },
  cardContainerSent: {
    alignItems: "flex-end",
  },
  card: {
    backgroundColor: "#F5F6F8", // Simple light gray
    borderRadius: Matrics.s(16),
    padding: Matrics.s(16),
    width: "70%",
    overflow: "hidden",
  },
  cardSent: {
    backgroundColor: "#F5F6F8", // Same neutral gray for both sides
  },
  titleSkeleton: {
    width: "70%",
    height: 20,
    borderRadius: 6,
    backgroundColor: "#E0E0E0", // Simple gray
    marginBottom: Matrics.vs(12),
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Matrics.vs(10),
  },
  iconSkeleton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E0E0E0",
    marginRight: Matrics.s(8),
    overflow: "hidden",
  },
  infoTextSkeleton: {
    width: "50%",
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    overflow: "hidden",
  },
  buttonSkeleton: {
    width: "100%",
    height: 45,
    borderRadius: 30,
    backgroundColor: "#E0E0E0", // Simple gray button
    marginTop: Matrics.vs(10),
    overflow: "hidden",
  },
  buttonSkeletonSent: {
    backgroundColor: "#E0E0E0", // Same gray for consistency
  },
  timeSkeleton: {
    width: "10%",
    height: 10,
    borderRadius: 6,
    backgroundColor: "#D0D0D0", // Simple gray for timestamp
    marginTop: Matrics.vs(6),
    overflow: "hidden",
  },
  timeSkeletonSent: {
    alignSelf: "flex-end",
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

export default QuizCardSkeleton;
