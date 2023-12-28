import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, StatusBar, StyleSheet } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MagnifyingGlassIcon, CalendarDaysIcon, MapPinIcon } from 'react-native-heroicons/outline';
import { debounce } from "lodash";
import { theme } from '../theme';
import { fetchLocations, fetchWeatherForecast } from '../api/weather';
import * as Progress from 'react-native-progress';
import { weatherImages } from '../constants';
import { getData, storeData } from '../utils/asyncStorage';
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
        const navigation = useNavigation();
        const [selectedRegion, setSelectedRegion] = useState({
            lat: 0,
            long: 0,
        });
        const [showSearch, toggleSearch] = useState(false);
        const [locations, setLocations] = useState([]);
        const [loading, setLoading] = useState(true);
        const [weather, setWeather] = useState({});
        const [selectedDay, setSelectedDay] = useState(null);
    
        const handleSearch = search => {
            if (search && search.length > 2)
                fetchLocations({ cityName: search }).then(data => {
                    setLocations(data);
                });
        }
    
        const handleLocation = loc => {
            setLoading(true);
            toggleSearch(false);
            setLocations([]);
            fetchWeatherForecast({
                cityName: loc.name,
                days: '7',
            }).then(data => {
                setLoading(false);
                setWeather(data);
                storeData('city', loc.name);
                setCurrentTemp(data?.current?.temp_c || 0); // Seçilen şehrin sıcaklık değerini güncelle
            });
        }
    
        const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);
    
        const { location, current } = weather || {};
    
        const [currentTemp, setCurrentTemp] = useState(current?.temp_c || 0);
    
        const handleIncrementTemp = () => {
            setCurrentTemp((prevTemp) => (prevTemp || 0) + 1);
        };
    
        const onPress = () => {
            const { lat, lon } = location;
            setSelectedRegion({
                lat: lat,
                long: lon
            });
            navigation.navigate('Map', {
                long: lon,
                lat: lat
            });
        }
    
        const onDayPress = (item) => {
            setSelectedDay(item);
        }
    
        useEffect(() => {
            fetchMyWeatherData();
        }, []);
    
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
                setCurrentTemp(data?.current?.temp_c || 0); // Seçilen şehrin sıcaklık değerini güncelle
            });
        }

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
                        {/**search section */}
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
                                        onChangeText={handleTextDebounce}
                                        placeholder="Search City"
                                        placeholderTextColor={'lightgray'}
                                        style={{ flex: 1, fontSize: 16, color: 'white', paddingLeft: 16, margin: 4, }}

                                    />
                                ) : null}

                                <TouchableOpacity
                                    onPress={() => toggleSearch(!showSearch)}
                                    style={{ backgroundColor: theme.bgWhite(0.3), borderRadius: 999, padding: 12, margin: 4 }}>
                                    <MagnifyingGlassIcon size={25} color="white" />
                                </TouchableOpacity>
                            </View>

                            {locations.length > 0 && showSearch ? (
                                <View style={{
                                    position: 'absolute',
                                    borderWidth: 1,
                                    borderColor: theme.bgWhite(0.3),
                                    width: '100%',
                                    backgroundColor: '#ccc',
                                    top: 70,
                                    borderRadius: 20,
                                    marginTop: 9,
                                    marginLeft: 9
                                }}>
                                    {locations.map((loc, index) => (
                                        <TouchableOpacity
                                            onPress={() => handleLocation(loc)}
                                            key={index}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                borderBottomWidth: index + 1 !== locations.length ? 2 : 0,
                                                borderBottomColor: "gray",
                                                padding: 20,
                                            }}>
                                            <MapPinIcon size={20} color="gray" />
                                            <Text style={{ color: 'black', fontSize: 16, marginLeft: 2 }}>{loc?.name}, {loc?.country}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : null
                            }
                        </View>
                        {/* forecast section */}
                        <View
                            style={{
                                display: "flex",
                                justifyContent: "space-around",
                                flex: 1,
                                marginBottom: 10,
                            }}>
                            {/* location */}
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
                            {/* weather image */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "center",
                                }}>
                                <Image
                                    source={weatherImages[current?.condition.text] || require('../assets/image/sun.png')}
                                    style={{
                                        width: 250,
                                        height: 250,
                                    }} />
                            </View>
                            <View
                style={{
                    flexDirection: 'column',
                    marginVertical: 2,
                    alignItems: 'center',
                }}>
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
                <TouchableOpacity onPress={handleIncrementTemp}>
                    <Text>Increment Temperature</Text>
                </TouchableOpacity>
                <Text
                    style={{
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#cccccc',
                        fontWeight: '400',
                        fontSize: 14,
                        letterSpacing: 2,
                    }}>
                    {current?.condition?.text}
                </Text>
                <TouchableOpacity style={[styles.button]} onPress={onPress}>
                    <Text style={styles.buttonText}>Where am I</Text>
                </TouchableOpacity>
            </View>
                            {/* other stats */}
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginHorizontal: 40 }}>
                                <View style={{ display: "flex", alignItems: "center", marginHorizontal: 2, flexDirection: "row" }}>
                                    <Image source={require('../assets/icons/wind.png')} style={{
                                        height: 18, width
                                            : 18
                                    }} />
                                    <Text style={{ fontWeight: "500", color: "white" }}>{current?.wind_kph}</Text>
                                </View>
                                <View style={{ display: "flex", justifyContent: "space-between", marginHorizontal: 4, flexDirection: "row", alignItems: "center", marginHorizontal: 2 }}>
                                    <Image source={require('../assets/icons/drop.png')} style={{
                                        height: 18, width
                                            : 18
                                    }} />
                                    <Text style={{ fontWeight: "500", color: "white" }}> {current?.humidity}</Text>
                                </View>
                                <View style={{ display: "flex", alignItems: "center", marginHorizontal: 2, flexDirection: "row" }}>
                                    <Image source={require('../assets/image/sun.png')} style={{
                                        height: 18, width
                                            : 18
                                    }} />
                                    <Text style={{ fontWeight: "500", color: "white" }}> {weather?.forecast?.forecastday[0]?.astro?.sunrise}</Text>
                                </View>
                            </View>
                        </View>
                        {/* forecast for next day's */}
                        <View style={{ marginBottom: 20, marginVertical: 20, }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 5, }}>
                                <CalendarDaysIcon size={22} color="white" />
                                <Text style={{ fontSize: 16, color: "white", marginLeft: 8 }}>
                                    Daily Forecast
                                </Text>
                            </View>
                            <ScrollView
                                horizontal
                                contentContainerStyle={{ paddingHorizontal: 15 }}
                                showsHorizontalScrollIndicator={false}>
                                {weather?.forecast?.forecastday?.map((item, index) => {
                                    let date = new Date(item.date);
                                    let options = { weekday: 'long' };
                                    let dayName = date.toLocaleDateString('en-US', options);
                                    dayName = dayName.split(',')[0];

                                    return (
                                        <TouchableOpacity
                                            onPress={() => onDayPress(item)}
                                            key={index}
                                            style={{
                                                flex: 1,
                                                margin: 5,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                width: 100,
                                                marginTop: 15,
                                                height: "auto",
                                                borderRadius: 25,
                                                paddingVertical: 3,
                                                marginBottom: 1,
                                                backgroundColor: theme.bgWhite(0.15)
                                            }}>
                                            <Image source={weatherImages[item?.day?.condition?.text] || require('../assets/image/sun.png')} style={{ height: 44, width: 44 }} />
                                            <Text style={{ color: "white", fontSize: 12, fontWeight: '300' }}>{dayName}</Text>
                                            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{item?.day?.avgtemp_c}&#176;</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </SafeAreaView>
                )
            }
            {selectedDay && (
                <View style={{ flex: 1, position: 'absolute', backgroundColor: 'rgba(0, 0, 0, 0.9)', top: 0, bottom: 0, left: 0, right: 0 }}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
                            {selectedDay.dayName}
                        </Text>
                        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
                            {selectedDay.date}
                        </Text>
                        <Image source={weatherImages[selectedDay?.day?.condition?.text] || require('../assets/image/sun.png')} style={{ height: 100, width: 100, marginBottom: 20 }} />
                        <Text style={{ color: 'white', fontSize: 36, fontWeight: 'bold', marginBottom: 20 }}>
                            {selectedDay?.day?.avgtemp_c}&#176;
                        </Text>
                        {/* Diğer verileri buraya ekleyebilirsiniz */}
                        <Text style={{ color: 'gray', fontSize: 16, marginBottom: 10 }}>
                            {selectedDay?.day?.condition?.text}
                        </Text>
                        <TouchableOpacity style={{ padding: 10, backgroundColor: 'orange', borderRadius: 10 }} onPress={() => setSelectedDay(null)}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Geri Dön</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
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
