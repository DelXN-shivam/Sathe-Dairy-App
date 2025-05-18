import React, { useState, useCallback, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Image
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../contexts/authContext";
import getEnvVars from "../../../config/environment";

const { API_URL } = getEnvVars();
const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 20;
const ITEM_HEIGHT = 120;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function ProductList({ navigation }) {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const scrollY = useRef(new Animated.Value(0)).current;
    const { getAuthHeader } = useAuth();

    const fetchProducts = async (pageNum = 1, shouldRefresh = false) => {
        if (pageNum === 1) setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/api/product/getAllProducts?page=${pageNum}&limit=${ITEMS_PER_PAGE}`,
                { headers: getAuthHeader() }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const newProducts = Array.isArray(data) ? data : data.products || [];
            
            if (shouldRefresh || pageNum === 1) {
                setProducts(newProducts);
            } else {
                setProducts(prev => [...prev, ...newProducts]);
            }
            
            setHasMore(newProducts.length === ITEMS_PER_PAGE);
            setPage(pageNum);
        } catch (error) {
            setError(error.message);
            Alert.alert(
                "Error",
                "Failed to load products. Please try again.",
                [{ text: "OK" }]
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            setIsLoadingMore(false);
        }
    };

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        setPage(1);
        fetchProducts(1, true);
    }, []);

    const handleLoadMore = useCallback(() => {
        if (!isLoadingMore && hasMore && !isRefreshing) {
            setIsLoadingMore(true);
            fetchProducts(page + 1);
        }
    }, [isLoadingMore, hasMore, page, isRefreshing]);

    const handleProductPress = useCallback((product) => {
        navigation.navigate('ProductDetail', { 
            productId: product._id,
            productName: product.productName
        });
    }, [navigation]);

    const deleteProduct = useCallback(async (productId) => {
        try {
            const response = await fetch(
                `${API_URL}/api/product/deleteProduct/${productId}`,
                {
                    method: 'DELETE',
                    headers: getAuthHeader(),
                }
            );

            if (!response.ok) throw new Error('Failed to delete product');
            
            setProducts(prev => prev.filter(p => p._id !== productId));
            Alert.alert("Success", "Product deleted successfully");
        } catch (error) {
            Alert.alert("Error", "Failed to delete product");
        }
    }, []);

    const handleLongPress = useCallback((product) => {
        Alert.alert(
            "Delete Product",
            `Are you sure you want to delete ${product.productName}?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: () => deleteProduct(product._id)
                }
            ]
        );
    }, [deleteProduct]);

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
            return () => {
                setProducts([]);
                setPage(1);
                setHasMore(true);
                setError(null);
            };
        }, [])
    );

    const getStockStatus = (quantity) => {
        if (quantity <= 0) return { color: '#FF5252', text: 'Out of Stock' };
        if (quantity < 10) return { color: '#FFC107', text: 'Low Stock' };
        return { color: '#4CAF50', text: 'In Stock' };
    };

    const renderItem = useCallback(({ item, index }) => {
        const stockStatus = getStockStatus(item.quantity);
        return (
            <Animated.View style={styles.itemContainer}>
                <TouchableOpacity 
                    style={styles.item}
                    onPress={() => handleProductPress(item)}
                    onLongPress={() => handleLongPress(item)}
                    delayLongPress={500}
                    activeOpacity={0.7}
                >
                    <View style={styles.productContent}>
                        <View style={styles.productHeader}>
                            <View style={styles.nameContainer}>
                                <Text style={styles.productName} numberOfLines={1}>
                                    {item.productName}
                                </Text>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {item.productCode}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.stockBadge, { backgroundColor: `${stockStatus.color}20` }]}>
                                <Text style={[styles.stockText, { color: stockStatus.color }]}>
                                    {stockStatus.text}
                                </Text>
                            </View>
                        </View>
                        
                        <View style={styles.productDetails}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Category</Text>
                                <Text style={styles.detailValue}>
                                    {typeof item.category === 'string' ? item.category : (item.categoryName || 'Unknown')}
                                </Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Quantity</Text>
                                <Text style={styles.detailValue}>{item.quantity}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.productFooter}>
                            <View>
                                <Text style={styles.priceLabel}>Price</Text>
                                <Text style={styles.productPrice}>
                                    ₹{item.sellingPrice.toLocaleString()}
                                </Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.editButton}
                                onPress={() => handleProductPress(item)}
                            >
                                <Text style={styles.editButtonText}>View Detail</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    }, [handleProductPress, handleLongPress]);

    const renderHeader = useCallback(() => (
        <Animated.View style={[
            styles.header,
            {
                opacity: scrollY.interpolate({
                    inputRange: [0, 50],
                    outputRange: [1, 0.9],
                    extrapolate: 'clamp',
                }),
                transform: [
                    {
                        translateY: scrollY.interpolate({
                            inputRange: [0, 100],
                            outputRange: [0, -5],
                            extrapolate: 'clamp',
                        }),
                    },
                ],
            }
        ]}>
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Products</Text>
                <Text style={styles.headerSubtitle}>{products.length} items in inventory</Text>
            </View>
        </Animated.View>
    ), [scrollY, products.length]);

    const ListEmptyComponent = useCallback(() => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
                <Image 
                    source={{ uri: 'https://img.icons8.com/color/96/000000/empty-box.png' }}
                    style={styles.emptyImage}
                />
                <Text style={styles.emptyTitle}>
                    {error ? "Oops!" : "No Products"}
                </Text>
                <Text style={styles.emptyText}>
                    {error 
                        ? "Something went wrong while loading products" 
                        : "Start by adding your first product to inventory"}
                </Text>
                {error ? (
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => fetchProducts()}
                    >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={styles.addFirstButton}
                        onPress={() => navigation.navigate("addProduct")}
                    >
                        <Text style={styles.addFirstButtonText}>Add Product</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    ), [error, navigation]);

    const ListFooterComponent = useCallback(() => {
        if (!isLoadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#0CC0DF" />
            </View>
        );
    }, [isLoadingMore]);

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0CC0DF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
            
            {renderHeader()}
            
            <AnimatedFlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={item => item._id.toString()}
                contentContainerStyle={[
                    styles.listContainer,
                    { paddingTop: 120 }
                ]}
                ListEmptyComponent={ListEmptyComponent}
                ListFooterComponent={ListFooterComponent}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={["#0CC0DF"]}
                        tintColor="#0CC0DF"
                        title="Pull to refresh"
                        titleColor="#6c757d"
                    />
                }
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            />

            <Animated.View style={styles.addButtonContainer}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate("addProduct", { 
                        onProductAdded: () => fetchProducts(1, true)
                    })}
                    activeOpacity={0.8}
                >
                    <Text style={styles.addButtonText}>+ New Product</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(248, 249, 250, 0.98)',
        zIndex: 10,
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        // elevation: 4,
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.1,
        // shadowRadius: 3,
        height: 100,
    },
    headerContent: {
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: "800",
        color: "#2d3436",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#6c757d",
        fontWeight: "500",
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    itemContainer: {
        marginBottom: 16,
        borderRadius: 16,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    item: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    productContent: {
        padding: 16,
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    nameContainer: {
        flex: 1,
        marginRight: 12,
    },
    productName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2d3436",
        marginBottom: 4,
    },
    badge: {
        backgroundColor: '#e3f6f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    badgeText: {
        color: '#0CC0DF',
        fontSize: 12,
        fontWeight: '600',
    },
    stockBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    stockText: {
        fontSize: 12,
        fontWeight: '600',
    },
    productDetails: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    detailItem: {
        marginRight: 20,
    },
    detailLabel: {
        fontSize: 12,
        color: '#6c757d',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2d3436',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 12,
    },
    productFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 12,
        color: '#6c757d',
        marginBottom: 2,
    },
    productPrice: {
        fontSize: 20,
        color: "#0CC0DF",
        fontWeight: "700",
    },
    editButton: {
        backgroundColor: '#0CC0DF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 400,
        padding: 20,
        paddingTop: 20,
    },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        width: width - 48,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    emptyImage: {
        width: 100,
        height: 100,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2d3436',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#0CC0DF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        width: '100%',
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    addFirstButton: {
        backgroundColor: '#0CC0DF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        width: '100%',
    },
    addFirstButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    addButtonContainer: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        left: 24,
    },
    addButton: {
        backgroundColor: '#0CC0DF',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});