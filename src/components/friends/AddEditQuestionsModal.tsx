import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import { IQuizQuestion } from "../../interfaces/quizInterfaces";
import { MAX_NO_OF_QUESTIONS, MIN_NO_OF_QUESTIONS } from "../../constants/commonConstant";
import useTranslation from "../../hooks/useTranslation";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Question {
  id: string;
  questionNumber: string;
  question: string;
}

interface AddEditQuestionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveChanges: (questions: IQuizQuestion[]) => void;
  initialQuestions?: IQuizQuestion[];
}

const AddEditQuestionsModal: React.FC<AddEditQuestionsModalProps> = ({
  visible,
  onClose,
  onSaveChanges,
  initialQuestions = [],
}) => {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<IQuizQuestion[]>(initialQuestions);
  const [blankQuestionError, setBlankQuestionError] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setQuestions(initialQuestions.length > 0 ? initialQuestions : []);
      // Animate modal sliding up
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate modal sliding down
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleQuestionChange = (index: number, text: string) => {
    setBlankQuestionError(null);
    setQuestions((prevQuestions) =>
      prevQuestions.map((questionItem, questionIndex) =>
        questionIndex === index ? { ...questionItem, question: text } : questionItem
      )
    );
  };

  const handleAddQuestion = () => {
    const newQuestionNumber = questions.length + 1;
    const formattedNumber = newQuestionNumber.toString().padStart(2, "0");
      const newQuestion: IQuizQuestion = {
        // id: `${Date.now()}`,
      // questionNumber: `Question ${formattedNumber}`,
      question: "",
    };
    setQuestions((prevQuestions) => [...prevQuestions, newQuestion]);
  };

  const handleDeleteQuestion = (index: number) => {
    setBlankQuestionError(null);
    setQuestions((prevQuestions) =>
      prevQuestions.filter((_, questionIndex) => questionIndex !== index)
    );
  };

  const handleSaveChanges = () => {
    if (questions.length < MIN_NO_OF_QUESTIONS) {
      return;
    }
    // Check for blank questions
    const blankQuestionIndices = questions
      .map((questionItem, questionIndex) =>
        questionItem.question.trim() === '' ? questionIndex + 1 : null
      )
      .filter((index) => index !== null);
    
    if (blankQuestionIndices.length > 0) {
      setBlankQuestionError(
        blankQuestionIndices.length === 1
          ? t("quiz.add_edit_questions.blank_question_error_single", { questions: blankQuestionIndices.join(', ') })
          : t("quiz.add_edit_questions.blank_question_error_multiple", { questions: blankQuestionIndices.join(', ') })
      );
      return;
    }
    setBlankQuestionError(null);
    onSaveChanges(questions);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        {/* Backdrop with blur effect */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <BlurView
              style={styles.blurView}
              blurType="light"
              blurAmount={20}
              reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.10)"
            />
            <View style={styles.blurOverlay} />
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t("quiz.add_edit_questions.title")}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <View style={styles.closeIconContainer}>
                <Image
                  source={Images.CLOSE_ICON}
                  style={styles.closeIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Questions List */}
            {questions.map((question,index) => (
              <View key={index} style={styles.inputSection}>
                <View style={styles.questionHeader}>
                  <Text style={styles.label}>{t("quiz.add_edit_questions.question_label", { number: index + 1 })}</Text>
                  <TouchableOpacity onPress={() => handleDeleteQuestion(index)}>
                    <Image
                      source={Images.TRASH_ICON}
                      style={styles.trashIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={t("quiz.add_edit_questions.enter_question_placeholder")}
                    placeholderTextColor="rgba(26, 26, 26, 0.4)"
                    value={question.question}
                    onChangeText={(text) =>
                      handleQuestionChange(index, text)
                    }
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>
            ))}
          </ScrollView>
          {/* Error Message */}
          {questions.length < MIN_NO_OF_QUESTIONS && (
            <Text style={styles.errorText}>
              {t("quiz.add_edit_questions.min_questions_error", { count: MIN_NO_OF_QUESTIONS })}
            </Text>
          )}
          {blankQuestionError && (
            <Text style={styles.errorText}>{blankQuestionError}</Text>
          )}
          {questions.length > MAX_NO_OF_QUESTIONS && (
            <Text style={styles.errorText}>
              {t("quiz.add_edit_questions.max_questions_error", { count: MAX_NO_OF_QUESTIONS })}
            </Text>
          )}

          {/* Add Question Button */}
          {questions.length < MAX_NO_OF_QUESTIONS && (
          <TouchableOpacity
            style={styles.addQuestionButton}
            onPress={handleAddQuestion}
          >
            <View style={styles.addIconContainer}>
              <Image
                source={Images.PLUS_ICON}
                style={styles.addIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.addQuestionText}>{t("quiz.add_edit_questions.add_question")}</Text>
          </TouchableOpacity>
          )}

          {/* Save Changes Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveChanges}
          >
            <Text style={styles.saveButtonText}>{t("quiz.add_edit_questions.save_changes")}</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
  modalContent: {
    backgroundColor: colors.WHITE,
    borderTopLeftRadius: Matrics.s(24),
    borderTopRightRadius: Matrics.s(24),
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(20),
    paddingBottom: Matrics.vs(20),
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Matrics.vs(15),
  },
  title: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
  },
  closeButton: {
    padding: Matrics.s(1),
  },
  closeIconContainer: {
    width: Matrics.s(20),
    height: Matrics.s(20),
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: "100%",
    height: "100%",
  },
  inputSection: {
    marginBottom: Matrics.vs(16),
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Matrics.vs(5),
  },
  trashIcon: {
    width: Matrics.s(18),
    height: Matrics.s(18),
    tintColor: colors.DANGER,
  },
  errorText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.DANGER,
    marginBottom: Matrics.vs(8),
  },
  label: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(5),
  },
  inputContainer: {
    color: colors.TEXT_DARK,
    borderWidth: 1,
    borderColor: "#EDF1F3",
    borderRadius: Matrics.s(12),
    backgroundColor: colors.WHITE,
  },
  input: {
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(10),
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_PRIMARY,
    lineHeight: 24,
    // minHeight: Matrics.vs(50),
  },
  addQuestionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Matrics.vs(8),
    paddingHorizontal: Matrics.s(5),
    marginBottom: Matrics.vs(10),
  },
  addIconContainer: {
    width: Matrics.s(20),
    height: Matrics.s(20),
    borderRadius: Matrics.s(10),
    borderWidth: 1.5,
    borderColor: colors.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Matrics.s(8),
  },
  addIcon: {
    width: Matrics.s(10),
    height: Matrics.s(10),
    tintColor: colors.PRIMARY,
  },
  addQuestionText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.PRIMARY,
  },
  saveButton: {
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(15),
    alignItems: "center",
    justifyContent: "center",
    // marginTop: Matrics.vs(5),
  },
  saveButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
    lineHeight: Matrics.vs(20),
  },
});

export default AddEditQuestionsModal;
