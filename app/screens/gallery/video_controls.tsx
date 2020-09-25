// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {Animated, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import Slider from 'react-native-slider';

import {makeStyleSheetFromTheme} from '@utils/theme';
import {CallbackFunctionWithoutArguments} from 'types/screens/gallery';

export enum VIDEO_PLAYER_STATE {
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
}

interface VideoControlsProps {
    isLandscape: boolean;
    mainColor?: string;
    paused: boolean;
    onPlayPause(): void;
    onSeek(value: number): void;
}

export interface VideoControlsRef {
    showControls(playing: boolean): void;
    videoDuration(duration: number): void;
    videoProgress(progress: number): void;
}

const getStyles = makeStyleSheetFromTheme((isLandscape: boolean) => ({
    controlsRow: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 72,
        height: 72,
    },
    controlIcon: {
        height: 32,
    },
    progressContainer: {
        position: 'absolute',
        flexDirection: 'row',
        bottom: Platform.select({
            android: isLandscape ? 79 : 69,
            ios: isLandscape ? 64 : 89,
        }),
        marginHorizontal: 16,
    },
    progressColumnContainer: {
        flex: 1,
    },
    timerLabelsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: -7,
    },
    timerLabel: {
        fontSize: 12,
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: {width: -1, height: 1},
        textShadowRadius: 10,
    },
    thumb: {
        width: 15,
        height: 15,
        backgroundColor: 'white',
        borderWidth: 2,
    },
}));

const getControlIconAndAspectRatio = (paused: boolean) => {
    if (!paused) {
        return {icon: require('@assets/images/video_player/pause.png'), aspectRatio: 0.83};
    }

    return {icon: require('@assets/images/video_player/play.png'), aspectRatio: 0.83};
};

const humanizeVideoDuration = (seconds: number) => {
    const [begin, end] = seconds >= 3600 ? [11, 8] : [14, 5];
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(begin, end);
};

const VideoControls = forwardRef<VideoControlsRef, VideoControlsProps>((props: VideoControlsProps, ref) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(true);
    const styles = getStyles(props.isLandscape);

    const fadeControls = (toValue: number, delay = 0, callback?: CallbackFunctionWithoutArguments) => {
        Animated.timing(opacity, {
            toValue,
            duration: 250,
            delay,
            useNativeDriver: true,
        }).start(callback);
    };

    useEffect(() => {
        opacity.setValue(1);
    }, []);

    useImperativeHandle(ref, () => ({
        showControls,
        videoDuration,
        videoProgress,
    }), []);

    const showControls = (playing: boolean) => {
        setVisible(true);

        if (playing) {
            fadeControls(1, 0, () => {
                fadeControls(0, 1000, () => setVisible(false));
            });
        } else {
            fadeControls(1, 0);
        }
    };

    const playPause = () => {
        if (props.paused) {
            fadeControls(0, 250, () => setVisible(false));
        } else {
            fadeControls(1, 250, () => setVisible(true));
        }

        props.onPlayPause();
    };

    const seekEnd = (value: number) => {
        props.onSeek(value);
        setProgress(value);
        if (!props.paused) {
            fadeControls(0, 1000, () => setVisible(false));
        }
    };

    const seeking = (value: number) => {
        setProgress(value);
    };

    const seekStart = () => {
        opacity.stopAnimation();
        setVisible(true);
    };

    const videoDuration = (value: number) => {
        setDuration(value);
    };

    const videoProgress = (value: number) => {
        setProgress(value);
    };

    if (!visible) {
        return null;
    }

    const {icon, aspectRatio} = getControlIconAndAspectRatio(props.paused);
    return (
        <Animated.View
            pointerEvents='box-none'
            style={[StyleSheet.absoluteFill, {opacity, backgroundColor: 'rgba(0, 0, 0, 0.3)'}]}
        >
            <View style={[styles.controlsRow, StyleSheet.absoluteFill]}>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={playPause}
                >
                    <FastImage
                        source={icon}
                        style={[styles.controlIcon, {aspectRatio}]}
                    />
                </TouchableOpacity>
            </View>
            <View style={[styles.controlsRow, styles.progressContainer]}>
                <View style={styles.progressColumnContainer}>
                    <View style={[styles.timerLabelsContainer]}>
                        <Text style={styles.timerLabel}>
                            {humanizeVideoDuration(progress)}
                        </Text>
                        <Text style={styles.timerLabel}>
                            {humanizeVideoDuration(duration)}
                        </Text>
                    </View>
                    <Slider
                        onSlidingComplete={seekEnd}
                        onValueChange={seeking}
                        onSlidingStart={seekStart}
                        maximumValue={Math.floor(duration)}
                        value={Math.floor(progress)}
                        thumbStyle={[styles.thumb, {borderColor: props.mainColor}]}
                        minimumTrackTintColor={props.mainColor}
                    />
                </View>
            </View>
        </Animated.View>
    );
});

VideoControls.displayName = 'VideoControls';

export default VideoControls;