import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  colors,
  Matrics,
  FontsSize,
  typography,
} from "../../config/appStyling";

interface EthicalResponsibilityBarProps {
  userPercent: number;
  partnerPercent: number;
  userLabel?: string;
  partnerLabel?: string;
}

const EthicalResponsibilityBar: React.FC<EthicalResponsibilityBarProps> = ({
  userPercent,
  partnerPercent,
  userLabel = "You",
  partnerLabel = "Them",
}) => {
  const [pointerWidth, setPointerWidth] = useState(0);
  const total = userPercent + partnerPercent;
  const pointerPosition = total > 0 ? (partnerPercent / total) * 100 : 50;

  return (
    <View style={styles.container}>
      <View style={styles.labelsRow}>
        <Text style={styles.label}>{userLabel}</Text>
        <Text style={styles.label}>{partnerLabel}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          onLayout={(e) => setPointerWidth(e.nativeEvent.layout.width)}
          style={[
            styles.pointerContainer,
            {
              left: `${pointerPosition}%`,
              transform: [{ translateX: -pointerWidth / 2 }],
            },
          ]}
        >
          <View style={styles.pointer} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Matrics.vs(2),
    marginBottom: Matrics.vs(6),
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Matrics.vs(6),
  },
  label: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
  },
  barTrack: {
    height: Matrics.vs(8),
    borderRadius: Matrics.s(6),
    backgroundColor: "#94ABFA",
    position: "relative",
  },
  pointerContainer: {
    position: "absolute",
    top: -Matrics.vs(5),
    alignItems: "center",
  },
  pointer: {
    width: Matrics.s(20),
    height: Matrics.s(20),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.PRIMARY,
    borderWidth: 2,
    borderColor: colors.WHITE,
  },
});

export default EthicalResponsibilityBar;
