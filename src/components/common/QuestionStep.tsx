import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  IQuestion,
  OnboardingAnswerValue,
} from "../../interfaces/onboardingInterfaces";
import { ONBOARDING_QUESTION_TYPE } from "../../constants/commonConstant";
import QuestionRenderer, { QuestionRendererVariant } from "./QuestionRenderer";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import FontsSize from "../../config/appStyling/fontsSize";
import typography from "../../config/appStyling/typography";
import fontsSize from "../../config/appStyling/fontsSize";
import CardWithArc from "./CardWithArc";

export type QuestionStepProps = {
  question: IQuestion;
  answersByQuestionId: Record<number, OnboardingAnswerValue>;
  setAnswer: (questionId: number, value: OnboardingAnswerValue) => void;
  disabled: boolean;
  variant?: QuestionRendererVariant;
  showArc?: boolean;
  fromPrefrence?: boolean;
};

const QuestionStep: React.FC<QuestionStepProps> = ({
  question,
  answersByQuestionId,
  setAnswer,
  disabled,
  variant = "pill",
  showArc = false,
  fromPrefrence = false
}) => {
  if (question.question_type === ONBOARDING_QUESTION_TYPE.SECTION) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{question.question}</Text>
        <View style={styles.sectionDivider} />
        <View style={styles.sectionBody}>
          {(question.children ?? [])
            .filter((child) => child.is_active !== false)
            .sort(
              (firstQuestion, secondQuestion) =>
                firstQuestion.order_index - secondQuestion.order_index,
            )
            .map((child) => (
              <View key={child.id} style={styles.sectionChild}>
                <Text style={styles.sectionChildQuestionTitle}>
                  {child.question}
                </Text>
                <QuestionRenderer
                  question={child}
                  value={answersByQuestionId[child.id]}
                  onChange={(newValue) => setAnswer(child.id, newValue)}
                  disabled={disabled}
                  variant={variant}
                />
              </View>
            ))}
        </View>
      </View>
    );
  }

  const content = (
    <>
      <Text style={fromPrefrence ? styles.prefrenceQuestionTitle : styles.questionTitle}>{question.question}</Text>
      <QuestionRenderer
        question={question}
        value={answersByQuestionId[question.id]}
        onChange={(newValue) => setAnswer(question.id, newValue)}
        disabled={disabled}
        variant={variant}
      />
    </>
  );

  if (showArc) {
    return <CardWithArc showBottomGlow={true}>{content}</CardWithArc>;
  }

  return <View>{content}</View>;
};

const styles = StyleSheet.create({
  questionTitle: {
    fontSize: fontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.ms(10),
  },
  prefrenceQuestionTitle: {
    fontSize: fontsSize.Large,
    fontFamily: typography.fontFamily.Poppins.Bold,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.ms(10),
  },
  sectionChildQuestionTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(28),
    marginBottom: Matrics.vs(5),
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: "rgba(26, 26, 26, 0.10)",
    borderRadius: Matrics.s(18),
    backgroundColor: "rgba(26, 26, 26, 0.015)",
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Matrics.vs(14),
  },
  sectionTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(26, 26, 26, 0.08)",
    marginTop: Matrics.vs(10),
    marginBottom: Matrics.vs(8),
  },
  sectionBody: {
    gap: Matrics.vs(18),
  },
  sectionChild: {
    paddingTop: Matrics.vs(6),
  },
});

export default QuestionStep;
