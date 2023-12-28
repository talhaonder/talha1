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
}
export const storeSearchHistory = async (searchTerm) => {
    try {
      // Önce mevcut arama geçmişini al
      const existingHistory = await AsyncStorage.getItem('searchHistory');
      const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
  
      // Yeni arama terimini arama geçmişi dizisine ekle
      historyArray.push(searchTerm);
  
      // Arama geçmişini güncelle ve AsyncStorage'e kaydet
      await AsyncStorage.setItem('searchHistory', JSON.stringify(historyArray));
    } catch (error) {
      console.log('Error storing search history: ', error);
    }
  };
  
  export const getSearchHistory = async () => {
    try {
      // AsyncStorage'den arama geçmişini al
      const history = await AsyncStorage.getItem('searchHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.log('Error retrieving search history: ', error);
      return [];
    }
  };