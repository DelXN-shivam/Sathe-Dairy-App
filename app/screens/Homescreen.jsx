import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Image, Platform, Animated, TextInput, ActivityIndicator, Dimensions, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import Icon from "react-native-vector-icons/MaterialIcons";
import getEnvVars from '../../config/environment';
import { useAuth } from "../contexts/authContext";
import axios from "axios";
import RefreshableScrollView from '../components/RefreshableScrollView';
const { width, height } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const { authState, logout, getAuthHeader } = useAuth();
  const { API_URL } = getEnvVars();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [counts, setCounts] = useState({
    inwardCount: 0,
    outwardCount: 0,
    supplierCount: 0,
  });

  const fetchCounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/count`, {
        headers: getAuthHeader(),
      });
      setCounts(response.data);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCounts();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const menuItems = [
    {
      count: counts.inwardCount,
      label: "INWARD",
      description: "Receive and Store Products",
      icon: "cart",
      screen: "InwardListing",
      gradient: ['#3B82F6', '#2563EB'],
      iconBg: '#60A5FA',
      bgPattern: '#EFF6FF', // Light blue background
      borderColor: '#BFDBFE',
    },
    {
      count: counts.outwardCount,
      label: "OUTWARD",
      description: "Dispatch Finish Goods",
      icon: "rocket",
      screen: "OutwardListing",
      gradient: ['#8B5CF6', '#6D28D9'],
      iconBg: '#A78BFA',
      bgPattern: '#F5F3FF', // Light purple background
      borderColor: '#DDD6FE',
    },
    // {
    //   count: counts.transportCount,
    //   label: "TRANSPORT",
    //   description: "Track Vehicle & Driver Information",
    //   icon: "car",
    //   screen: "TransportListing",
    //   gradient: ['#EC4899', '#DB2777'],
    //   iconBg: '#F472B6',
    //   bgPattern: '#FDF2F8', // Light pink background
    //   borderColor: '#FBCFE8',
    // }

    {
      count: counts.supplierCount,
      label: "Supplier",
      description: "Track Vehicle & Driver Information",
      icon: "car",
      screen: "SupplierListing",
      gradient: ['#EC4899', '#DB2777'],
      iconBg: '#F472B6',
      bgPattern: '#FDF2F8', // Light pink background
      borderColor: '#FBCFE8',
    }
];

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 80],
    extrapolate: 'clamp',
  });

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  // Search API call
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // http://localhost:3000/api/search?query=ra
      const response = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = debounce(performSearch, 500);

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  // Render search result item
  const renderSearchResult = (item) => {
    const getIcon = () => {
      switch (item.type) {
        case 'inward': return 'arrow-down-circle';
        case 'outward': return 'arrow-up-circle';
        case 'product': return 'cube';
        case 'customer': return 'person';
        default: return 'document';
      }
    };

    const getTitle = () => {
      switch (item.type) {
        case 'inward': return item.invoiceNo || 'Inward Entry';
        case 'outward': return item.invoiceNo || 'Outward Entry';
        case 'product': return item.productName;
        case 'customer': return item.customerName;
        default: return 'Unknown Item';
      }
    };

    const handleResultPress = () => {
      // Navigate to appropriate screen based on type
      switch (item.type) {
        case 'inward':
          navigation.navigate('InwardDetail', { inwardId: item._id });
          break;
        case 'outward':
          navigation.navigate('OutwardDetail', { outwardId: item._id });
          break;
        case 'product':
          navigation.navigate('ProductDetail', { productId: item._id });
          break;
        case 'customer':
          navigation.navigate('CustomerDetail', { customerId: item._id });
          break;
      }
      setSearchVisible(false);
    };

    return (
      <TouchableOpacity
        style={styles.searchResultItem}
        onPress={handleResultPress}
      >
        <View style={styles.searchResultIcon}>
          <Ionicons name={getIcon()} size={24} color="#6B7280" />
        </View>
        <View style={styles.searchResultContent}>
          <Text style={styles.searchResultTitle}>{getTitle()}</Text>
          <Text style={styles.searchResultType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color="#6B7280" />
      </TouchableOpacity>
    );
  };

  return (
    <RefreshableScrollView
      onRefresh={fetchCounts}
      style={styles.container}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
        
        <Animated.View style={[styles.header, { height: height*0.12}]}>
          <LinearGradient colors={['#1E40AF', '#2563EB']} style={styles.headerGradient}>
          {!searchVisible ? (
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <View style={styles.profileSection}>
                  <Image 
                    source={require('../../assets/images/icon.png')} 
                    style={styles.avatar}
                  />
                  <View style={styles.titleContainer}>
                    <Text style={styles.greeting}>Welcome back to</Text>
                    <Text style={styles.companyName}>Sathe's Dairy</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={() => setSearchVisible(true)}
                >
                  <Icon name="search" color="white" size={24} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.searchBar}>
              <Icon name="search" color="white" size={20} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoFocus
              />
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setSearchVisible(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <Icon name="close" color="white" size={24} />
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </Animated.View>


      {searchVisible ? (
        <View style={styles.searchResultsContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : searchResults.length > 0 ? (
            <ScrollView style={styles.searchResultsList}>
              {searchResults.map((result, index) => (
                <View key={result._id || index}>
                  {renderSearchResult(result)}
                </View>
              ))}
            </ScrollView>
          ) : searchQuery ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No results found</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
              colors={['#2563EB']}
              progressBackgroundColor="#ffffff"
            />
          }
        >
           <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Quick Overview</Text>
            <View style={styles.statsGrid}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.statCard}
                  onPress={() => navigation.navigate(item.screen)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={24} color="white" />
                  </View>
                  <Text style={styles.statCount}>{item.count}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.cardsContainer}>
            <Text style={styles.sectionTitle}>Main Actions</Text>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => navigation.navigate(item.screen)}
                style={styles.cardWrapper}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={styles.card}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardContent}>
                    <View style={[styles.cardIconContainer, { backgroundColor: item.iconBg }]}>
                      <Ionicons name={item.icon} size={28} color="white" />
                    </View>
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{item.label}</Text>
                      <Text style={styles.cardDescription}>{item.description}</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
      <View className="h-24"></View>
    </View>
    </RefreshableScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    width: '100%',
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    // paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ,
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    top:18
  },
  titleContainer: {
    marginLeft: 12,
    top:18,
  },
  greeting: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  companyName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    top:18
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginTop: 10,
    padding: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  closeButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  cardsContainer: {
    padding: 20,
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  card: {
    borderRadius: 16,
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
// New styles for search functionality
searchResultsContainer: {
  flex: 1,
  backgroundColor: 'white',
},
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
searchResultsList: {
  flex: 1,
},
searchResultItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
},
searchResultIcon: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#F3F4F6',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
searchResultContent: {
  flex: 1,
},
searchResultTitle: {
  fontSize: 16,
  fontWeight: '500',
  color: '#1F2937',
  marginBottom: 4,
},
searchResultType: {
  fontSize: 14,
  color: '#6B7280',
},
noResultsContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: 40,
},
noResultsText: {
  fontSize: 16,
  color: '#6B7280',
},
// ... (rest of existing styles remain unchanged)
});

export default HomeScreen;