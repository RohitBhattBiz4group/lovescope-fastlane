import React from "react";
import { ImageStyle, StyleProp } from "react-native";
import FastImage, { FastImageProps, Source, ImageStyle as FastImageStyle } from "react-native-fast-image";
import Images from "../../config/Images";

interface CachedImageProps {
    source: { uri: string } | number;
    style?: StyleProp<ImageStyle>;
    resizeMode?: FastImageProps["resizeMode"];
    defaultSource?: number;
}

/**
 * CachedImage component that uses FastImage for better performance and caching
 * Falls back to React Native Image if uri is not provided
 */
const CachedImage: React.FC<CachedImageProps> = ({
    source,
    style,
    resizeMode = "cover",
    defaultSource = Images.NO_USER_IMAGE,
}) => {
    // If source is a require() (number), use regular Image
    if (typeof source === "number") {
        const Image = require("react-native").Image;
        return <Image source={source} style={style} resizeMode={resizeMode} />;
    }

    // If no URI provided, show default image
    if (!source?.uri) {
        const Image = require("react-native").Image;
        return (
            <Image
                source={defaultSource}
                style={style}
                resizeMode={resizeMode as any}
            />
        );
    }

    // Use FastImage for remote URIs with caching
    const fastImageSource: Source = {
        uri: source.uri,
        priority: FastImage.priority.normal,
        cache: FastImage.cacheControl.immutable, // Cache forever until manually cleared
    };

    return (
        <FastImage
            source={fastImageSource}
            style={style as StyleProp<FastImageStyle>}
            resizeMode={FastImage.resizeMode[resizeMode] || FastImage.resizeMode.cover}
            defaultSource={defaultSource}
        />
    );
};

export default CachedImage;
