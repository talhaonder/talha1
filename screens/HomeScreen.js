import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, StatusBar, StyleSheet, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MagnifyingGlassIcon, CalendarDaysIcon, MapPinIcon } from 'react-native-heroicons/outline';
import { debounce } from "lodash";
import { theme } from '../theme';
import { fetchLocations, fetchWeatherForecast } from '../api/weather';
import * as Progress from 'react-native-progress';
import { weatherImages } from '../constants';
import { getData, storeData, getSearchHistory, saveToSearchHistory } from '../utils/asyncStorage';
import { useNavigation } from "@react-navigation/native";

/**
 * Ana ekran component'i.
 */
export default function HomeScreen() {
    const navigation = useNavigation();

    const formatSunriseTime = (rawTime) => {
        // API'den gelen rawTime değerini kontrol et
        console.log('rawTime from API:', rawTime);

        // Saat bilgisini alınan sayıya göre oluştur
        const date = new Date(`2000-01-01T${rawTime}:00:00`);

        // Oluşturulan tarihi kontrol et
        console.log('Formatted Date:', date);

        // Tarihi istediğiniz formatta yazdır
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    // Seçilen bölge bilgisini tutan state
    const [selectedRegion, setSelectedRegion] = useState({
        lat: 0,
        long: 0,
    });
    const [selectedDay, setSelectedDay] = useState(null);
    const [sunrise, setSunrise] = useState(null);

    const selectedDatAstroSunrise = selectedDay?.day?.astro?.sunrise || 0;

    // Arama çubuğunu gösterip/gizlemeye yarayan state
    const [showSearch, toggleSearch] = useState(false);

    // Arama sonuçlarını tutan state
    const [locations, setLocations] = useState([]);

    // Yüklenme durumunu kontrol eden state
    const [loading, setLoading] = useState(true);

    // Hava durumu bilgilerini tutan state
    const [weather, setWeather] = useState({});

    // Arama geçmişi bilgisini tutan state
    const [searchHistory, setSearchHistory] = useState([]);

    // Arama geçmişini gösterip/gizlemeye yarayan state
    const [showHistory, setShowHistory] = useState(false);

    // Arama metnini tutan state
    const [searchText, setSearchText] = useState('');

    // Arama geçmişi gösterip/gizlemeye yarayan fonksiyon
    const toggleHistory = () => {
        setShowHistory(!showHistory);
    };
    const [currentTemp, setCurrentTemp] = useState((current && current.temp_c) || 0);
    const [selectedCurrentCondition, setSelectedCurrentCondition] = useState((current && current.condition && current.condition.text) || '');
    const [selectedDayWind, setWind] = useState((current && current.wind_kph) || 0);
    const [selectedDayHumidity, setHumidity] = useState((current && current.humidity) || 0);
    const [selectedDayWeatherImage, setSelectedDayWeatherImage] = useState(weatherImages[(current && current.condition && current.condition.text)] || require('../assets/image/sun.png'));

    /**
     * Arama işlemi başlatan fonksiyon.
     * @param {string} search - Arama metni
     */
    const handleSearch = async (search) => {
        setSearchText(search);

        // Arama metni değiştiğinde, arama geçmişi görünürlüğünü kapat
        setShowHistory(false);

        if (search && search.length > 2) {
            const data = await fetchLocations({ cityName: search });
            setLocations(data);
        } else {
            setLocations([]); // Arama kriteri yoksa, konumları temizle
        }
    };

    /**
     * Metin girişine debounce uygulanan fonksiyon.
     */
    const handleTextDebounce = useCallback(
        debounce(async (search) => {
            await handleSearch(search);
        }, 1200),
        []
    );

    const { location, current } = weather || {};
    // Add this function


    // TextInput referansı
    const searchInputRef = useRef(null);

    /**
     * Günlerden birine basıldığında çağrılan fonksiyon.
     * @param {object} item - Seçilen gün objesi
     */

    const handleDayPress = (item) => {
        setSelectedDay({ ...item, dayName });
        setCurrentTemp(item?.day?.avgtemp_c || 0);
        setSelectedDayWeatherImage(weatherImages[item?.day?.condition?.text] || require('../assets/image/sun.png'));

        const date = new Date(item.date);
        const options = { weekday: 'long' };
        const dayName = date.toLocaleDateString('en-US', options).split(',')[0];

        // Fix sunrise extraction from astro data    
        setSelectedCurrentCondition(item?.day?.condition?.text || '');
        setWind(item?.day?.maxwind_kph || 0);
        setHumidity(item?.day?.avghumidity || 0);

        // Set the sunrise time in the state
        const selectedDatAstroSunrise = item?.day?.astro?.sunrise || 0;
        setSunrise(selectedDatAstroSunrise ? formatSunriseTime(selectedDatAstroSunrise) : '');
    };

    /**
     * Haritaya git butonuna basıldığında çağrılan fonksiyon.
     */
    const onPress = () => {
        const { lat, lon } = location;
        setSelectedRegion({
            lat: lat,
            long: lon
        });
        navigation.navigate('Map', {
            long: lon,
            lat: lat,
            sunrise: selectedDay?.astro?.sunrise || '', // Use selectedDay for sunrise
        });
    };


    /**
     * Günlerden birine basıldığında çağrılan fonksiyon.
     * @param {object} item - Seçilen gün objesi
     */
    const onDayPress = (item) => {
        setSelectedDay(item);
    };

    /**
     * Lokasyon bilgisini güncelleyen ve hava durumu verilerini getiren fonksiyon.
     * @param {object} loc - Yeni lokasyon bilgisi
     */
    const handleLocation = async (loc) => {
        setLoading(true);
        toggleSearch(false);
        setLocations([]);
        await saveToSearchHistory(loc);

        // Yeni konum ekledikten sonra arama geçmişini güncelle
        getSearchHistory().then((history) => {
            setSearchHistory(history);
        });

        fetchWeatherForecast({
            cityName: loc.name,
            days: '7',
        }).then((data) => {
            setLoading(false);
            setWeather(data);
            storeData('city', loc.name);
            setCurrentTemp(data?.current?.temp_c || 0);
        });
    };
    useEffect(() => {
        const fetchData = async () => {
            const history = await getSearchHistory();
            setSearchHistory(history);
        };

        fetchData();
    }, []);


    /**
     * İlk render işlemi sırasında hava durumu verilerini getiren useEffect fonksiyonu.
     */
    useEffect(() => {
        fetchMyWeatherData();
    }, []);

    /**
     * Hava durumu verileri geldiğinde çalışan useEffect fonksiyonu.
     */
    useEffect(() => {
        if (weather?.forecast?.forecastday?.length > 0) {
            handleDayPress(weather.forecast.forecastday[0]);
        }
    }, [weather]);

    /**
     * Hava durumu verilerini getiren asenkron fonksiyon.
     */
    const fetchMyWeatherData = async () => {
        let myCity = await getData('city');
        let cityName = 'Ankara';
        if (myCity) {
            cityName = myCity;
        }
        fetchWeatherForecast({
            cityName,
            days: '7'
        }).then(data => {
            setWeather(data);
            setLoading(false);
            setCurrentTemp(data?.current?.temp_c || 0);
        });
    };

    /**
     * Arama çubuğu gösterildiğinde TextInput'a odaklanan useEffect fonksiyonu.
     */
    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);
    return (
        <View style={{ flex: 1 }}>
            <StatusBar />

            <Image blurRadius={70} source={require('../assets/image/bg.png')} style={{ position: 'absolute', height: '100%', width: '100%' }} />
            {
                loading ? (
                    <View style={{ flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", }}>
                        <Progress.CircleSnail thickness={10} size={140} color={"#0bb3b2"} />
                    </View>
                ) : (
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={{ height: 70, padding: 12, zIndex: 50 }}>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                borderRadius: 999,
                                backgroundColor: showSearch ? theme.bgWhite(0.2) : 'transparent'
                            }}>
                                {showSearch ? (
                                    <TextInput
                                        ref={searchInputRef}
                                        onChangeText={(text) => {
                                            handleTextDebounce(text);
                                        }}
                                        placeholder="Search City"
                                        placeholderTextColor={'lightgray'}
                                        style={{ flex: 1, fontSize: 16, color: 'white', paddingLeft: 16, margin: 4 }}
                                    />
                                ) : null}

                                <TouchableOpacity
                                    onPress={() => {
                                        toggleSearch(!showSearch);
                                        Keyboard.dismiss(); // Klavyeyi kapat
                                    }}
                                    style={{ backgroundColor: theme.bgWhite(0.3), borderRadius: 999, padding: 12, margin: 4 }}
                                >
                                    <MagnifyingGlassIcon size={25} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={onPress}
                                    style={{ backgroundColor: theme.bgWhite(0.3), borderRadius: 999, padding: 12, margin: 4 }}>
                                    <MapPinIcon size={25} color="white" />
                                </TouchableOpacity>
                                {showHistory && (
                                    <View style={{
                                        position: 'absolute',
                                        width: '100%',
                                        backgroundColor: 'rgb(255, 157, 38)',
                                        top: 70,
                                        borderRadius: 20,
                                        marginTop: 9,
                                        marginLeft: 9,
                                        padding: 10,
                                        zIndex: 10,
                                    }}>
                                        <TouchableOpacity
                                            onPress={toggleHistory}
                                            style={{
                                                backgroundColor: theme.bgWhite(0.3),
                                                borderRadius: 999,
                                                padding: 12,
                                                margin: 4
                                            }}>
                                            <Text style={{ color: 'white' }}>History</Text>
                                        </TouchableOpacity>
                                        {/* Liste içeriği */}
                                        <ScrollView
                                            keyboardShouldPersistTaps="always"
                                            horizontal
                                            showsHorizontalScrollIndicator={false}>
                                            {searchHistory.map((historyItem, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    onPress={() => {
                                                        handleLocation(historyItem);
                                                        Keyboard.dismiss(); // Klavyeyi kapat
                                                    }}
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        borderLeftWidth: index + 100 !== searchHistory.length ? 0.2 : 0,
                                                        padding: 20,
                                                    }}>
                                                    <MapPinIcon size={20} color="gray" />
                                                    <Text style={{ color: 'black', fontSize: 16, marginLeft: 2 }}>{historyItem?.name}, {historyItem?.country}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {locations.length > 0 && showSearch && (
                                <View style={{
                                    position: 'absolute',
                                    width: '100%',
                                    backgroundColor: 'rgb(255, 157, 38)',
                                    top: 70,
                                    borderRadius: 20,
                                    marginTop: 9,
                                    marginLeft: 9,
                                    padding: 10,
                                    zIndex: 10,
                                }}>
                                    {/* Liste içeriği */}
                                    <ScrollView
                                        keyboardShouldPersistTaps="always"
                                        style={{ marginTop: 50 }}
                                    >
                                        {locations.map((loc, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => {
                                                    handleLocation(loc);
                                                    Keyboard.dismiss(); // Klavyeyi kapat
                                                }}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    borderLeftWidth: index + 100 !== locations.length ? 0.2 : 0,
                                                    padding: 20,
                                                }}>
                                                <MapPinIcon size={20} color="gray" />
                                                <Text style={{ color: 'black', fontSize: 16, marginLeft: 2 }}>{loc?.name}, {loc?.country}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* History gösterimi */}

                            {showSearch && (
                                <View style={{
                                    position: 'absolute',
                                    width: '100%',
                                    backgroundColor: 'rgb(255, 157, 38)',
                                    top: 70,
                                    borderRadius: 20,

                                    marginLeft: 9,
                                    padding: 10,
                                    zIndex: 10,
                                }}>
                                    {/* Liste içeriği */}
                                    <ScrollView
                                        keyboardShouldPersistTaps="always"
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                    >
                                        {searchHistory.map((historyItem, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => {
                                                    handleLocation(historyItem);
                                                    Keyboard.dismiss(); // Klavyeyi kapat
                                                }}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    borderLeftWidth: index + 100 !== searchHistory.length ? 0.2 : 0,
                                                    padding: 20,
                                                }}>
                                                <MapPinIcon size={20} color="gray" />
                                                <Text style={{ color: 'black', fontSize: 16, marginLeft: 2 }}>{historyItem?.name}, {historyItem?.country}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                </View>
                            )}

                        </View>

                        <View
                            style={{
                                display: "flex",
                                justifyContent: "space-around",
                                flex: 1,
                                marginBottom: 10,
                            }}>
                            <Text
                                style={{
                                    fontSize: 24,
                                    textAlign: "center",
                                    color: "white",
                                    fontWeight: "bold",
                                }}> {location?.name},
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: "500",
                                        color: "#cccc"
                                    }}>
                                    {" " + location?.country}
                                </Text>
                            </Text>

                            {selectedDay && (
                                <View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 18, color: '#ccc', fontWeight: 'bold' }}>
                                            {selectedDay.dayName}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                                        <Image
                                            source={selectedDayWeatherImage}
                                            style={{
                                                width: 250,
                                                height: 250,
                                            }}
                                        />
                                    </View>
                                    <View style={{ flexDirection: 'column', marginVertical: 2, alignItems: 'center' }}>
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                fontSize: 60,
                                                marginLeft: 15,
                                            }}>
                                            {currentTemp}&#176;
                                        </Text>
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontWeight: 'bold',
                                                color: '#cccccc',
                                                fontWeight: '400',
                                                fontSize: 14,
                                                letterSpacing: 2,
                                            }}>
                                            {selectedCurrentCondition}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginHorizontal: 40 }}>
                                <View style={{ display: "flex", alignItems: "center", marginHorizontal: 2, flexDirection: "row" }}>
                                    <Image source={require('../assets/icons/wind.png')} style={{
                                        height: 18, width
                                            : 18
                                    }} />
                                    <Text style={{ fontWeight: "500", color: "white" }}>{selectedDayWind}</Text>
                                </View>
                                <View style={{ display: "flex", justifyContent: "space-between", marginHorizontal: 4, flexDirection: "row", alignItems: "center", marginHorizontal: 2 }}>
                                    <Image source={require('../assets/icons/drop.png')} style={{
                                        height: 18, width
                                            : 18
                                    }} />
                                    <Text style={{ fontWeight: "500", color: "white" }}> {selectedDayHumidity}</Text>
                                </View>
                                <View style={{ display: "flex", alignItems: "center", marginHorizontal: 2, flexDirection: "row" }}>
                                    <Image source={require('../assets/image/sun.png')} style={{
                                        height: 18, width
                                            : 18
                                    }} />
                                    <Text style={{ fontWeight: "500", color: "white" }}>{formatSunriseTime(selectedDatAstroSunrise)}</Text>
                                </View>
                            </View>
                        </View>

                        {/* forecast for next day's */}
                        <View style={{ marginBottom: 20, marginVertical: 20, }}>
                                <ScrollView
                                    keyboardShouldPersistTaps="always"
                                    horizontal
                                    contentContainerStyle={{ paddingHorizontal: 15 }}
                                    showsHorizontalScrollIndicator={false}
                                >
                                    {weather?.forecast?.forecastday?.map((item, index) => {
                                        let date = new Date(item.date);
                                        let options = { weekday: 'long' };
                                        let dayName = date.toLocaleDateString('en-US', options);
                                        dayName = dayName.split(',')[0];

                                        return (
                                            <TouchableOpacity
                                                onPress={() => handleDayPress(item)}
                                                key={index}
                                                style={{
                                                    flex: 1,
                                                    margin: 5,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    width: 100,
                                                    height: 150,  // İlgili kısım: Elemanların yüksekliğini artırabilirsiniz.
                                                    borderRadius: 25,
                                                    paddingVertical: 3,
                                                    marginBottom: 1,
                                                    backgroundColor: theme.bgWhite(0.15),
                                                }}
                                            >
                                                <Image source={weatherImages[item?.day?.condition?.text] || require('../assets/image/sun.png')} style={{ height: 44, width: 44 }} />
                                                <Text style={{ color: 'white', fontSize: 12, fontWeight: '300' }}>{dayName}</Text>
                                                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{item?.day?.avgtemp_c}&#176;</Text>
                                                <Text style={{ color: 'white', fontSize: 12 }}>{item?.astro?.sunrise}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                        </View>

                    </SafeAreaView>
                )
            }
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ddc111',
        justifyContent: "flex-start",
        padding: 20,
    },
    title: {
        fontFamily: 'Menlo',
        fontSize: 12,
        fontWeight: '900',
        marginBottom: 8,
    },
    button: {
        marginTop: 40,
        backgroundColor: 'orange',
        width: 300,
        borderRadius: 25,
    },
    buttonText: {
        color: 'rgba(0,0,0,0.7)',
        textAlign: 'center',
    },
});