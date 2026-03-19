import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import {
  colors,
  Matrics,
  FontsSize,
  typography,
} from "../../config/appStyling";
import { TimelineSummaryResponse } from "../../interfaces/timelineInterface";
import useTranslation from "../../hooks/useTranslation";

interface TimelineSummaryCardProps {
  data: TimelineSummaryResponse | undefined;
  scopeLabel: string;
  onChangeScope: () => void;
  loading: boolean;
}

const TimelineSummaryCard: React.FC<TimelineSummaryCardProps> = ({
  data,
  scopeLabel,
  onChangeScope,
  loading,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.PRIMARY} />
      </View>
    );
  }

  if (!data) {
    return null;
  }

  const eventTitles = data.timeline_events.map((e) => e.title);
  const titlesText = eventTitles.length > 0
    ? `(${eventTitles.join(" \u00B7 ")})`
    : "";

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>
          {t("analyzer.timeline_summary.using_smart_context") || "Using smart context from"}{" "}
          <Text style={styles.headerScopeText}>{`'${scopeLabel}'`}</Text>
        </Text>
      </View>

      <Text style={styles.statsText}>
        {`${data.characters_pulled.toLocaleString()} ${t("analyzer.timeline_summary.characters_pulled") || "characters pulled"} \u00B7 ${data.total_count} ${t("analyzer.timeline_summary.events") || "events"}`}
      </Text>

      {titlesText.length > 0 && (
        <Text style={styles.titlesText}>{titlesText}</Text>
      )}

      <TouchableOpacity onPress={onChangeScope} style={styles.changeScopeRow}>
        <Text style={styles.changeScopeText}>
          {t("analyzer.timeline_summary.change_scope") || "Change scope >"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(47, 89, 235, 0.06)",
    borderRadius: Matrics.s(12),
    padding: Matrics.s(14),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.12)",
  },
  headerRow: {
    marginBottom: Matrics.vs(6),
  },
  headerText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  headerScopeText: {
    fontFamily: typography.fontFamily.Satoshi.Bold,
  },
  statsText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_DARK,
    opacity: 0.7,
    marginBottom: Matrics.vs(4),
  },
  titlesText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_DARK,
    opacity: 0.6,
    marginBottom: Matrics.vs(8),
    lineHeight: Matrics.vs(18),
  },
  changeScopeRow: {
    alignSelf: "flex-end",
  },
  changeScopeText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.PRIMARY,
  },
});

export default TimelineSummaryCard;
