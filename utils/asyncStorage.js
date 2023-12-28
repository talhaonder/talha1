// asyncStorage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeData = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, value);
    } catch (error) {
        console.log('Error storing value: ', error);
    }
};

export const getData = async (key) => {
    try {
        const value = await AsyncStorage.getItem(key);
        return value;
    } catch (error) {
        console.log('Error retrieving value: ', error);
    }
};

export const saveToSearchHistory = async (location) => {
    try {
        const SEARCH_HISTORY_KEY = '@WeatherApp:SearchHistory'; // Uygun bir anahtar seçin
        const existingHistory = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        const history = existingHistory ? JSON.parse(existingHistory) : [];

        const existingIndex = history.findIndex((item) => item.name === location.name);

        if (existingIndex !== -1) {
            history.splice(existingIndex, 1);
        }

        const updatedHistory = [...history, location];

        await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error('Error saving to search history:', error);
    }
};

export const getSearchHistory = async () => {
    try {
        const SEARCH_HISTORY_KEY = '@WeatherApp:SearchHistory'; // Uygun bir anahtar seçin
        const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Error getting search history:', error);
        return [];
    }
};
