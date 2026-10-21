import React, { useState } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useTheme } from "@context/ThemeContext";

type Props = {
    label: string;
    value?: string | null;
    onChange: (value: string) => void;
    placeholder?: string;
    maximumDate?: Date;
};

const toDate = (value?: string | null): Date => {
    const match = value?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (match) {
        return new Date(
            Number(match[3]),
            Number(match[2]) - 1,
            Number(match[1]),
        );
    }

    return new Date();
};

const toText = (date: Date): string =>
    `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1,
    ).padStart(2, "0")}/${date.getFullYear()}`;

const DateField = ({
    label,
    value,
    onChange,
    placeholder = "DD/MM/AAAA",
    maximumDate,
}: Props) => {
    const [show, setShow] = useState(false);
    const { colors } = useTheme();

    const handleChange = (
        event: DateTimePickerEvent,
        date?: Date,
    ) => {
        if (Platform.OS === "android") {
            setShow(false);
        }

        if (event.type === "set" && date) {
            onChange(toText(date));
        }
    };

    return (
        <View>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShow(true)}
                style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.background === '#ffffff' ? '#D5DCE5' : '#8794A7' }]}
            >
                <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>

                <Text
                    style={[
                        styles.value,
                        { color: value ? colors.text : colors.muted },
                    ]}
                >
                    {value || placeholder}
                </Text>
            </TouchableOpacity>

            {show && (
                <>
                    <DateTimePicker
                        value={toDate(value)}
                        mode="date"
                        display={
                            Platform.OS === "ios"
                                ? "spinner"
                                : "default"
                        }
                        maximumDate={maximumDate}
                        onChange={handleChange}
                    />

                    {Platform.OS === "ios" && (
                        <TouchableOpacity
                            onPress={() => setShow(false)}
                            style={styles.ok}
                        >
                            <Text style={styles.okText}>
                                OK
                            </Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );
};

export default DateField;

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: "#D5DCE5",
        borderRadius: 15,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginVertical: 10,
        backgroundColor: "#fff",
    },

    label: {
        fontSize: 13,
        color: "#6e6e6e",
        fontWeight: "bold",
        marginBottom: 5,
    },

    value: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111",
    },

    placeholder: {
        color: "#999",
        fontWeight: "normal",
    },

    ok: {
        alignSelf: "flex-end",
        paddingHorizontal: 16,
        paddingVertical: 6,
    },

    okText: {
        fontWeight: "800",
        color: "#062046",
    },
});
