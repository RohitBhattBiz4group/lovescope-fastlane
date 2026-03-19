import React from "react";
import { Text, View } from "react-native";
import { commonStyles } from "./styles";

interface CommonErrorProps {
  message?: string;
}

const CommonError: React.FC<CommonErrorProps> = ({ message }) => {
  if (!message) return null;

  return (
    <View>
      <Text style={commonStyles.errorText}>{message}</Text>
    </View>
  );
};

export default CommonError;

