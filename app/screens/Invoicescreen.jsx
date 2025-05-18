import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl
} from "react-native";
import { Card, Badge } from "react-native-paper";
import AsyncStorage from '@react-native-async-storage/async-storage';
import getEnvVars from "../../config/environment";
import { useAuth } from '../contexts/authContext';
import { useIsFocused } from '@react-navigation/native';

export default function InvoiceScreen() {
  const { API_URL } = getEnvVars();
  const { getAuthHeader } = useAuth();
  const isFocused = useIsFocused();
  
  const [inwardEntries, setInwardEntries] = useState([]);
  const [outwardEntries, setOutwardEntries] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [lastViewedTime, setLastViewedTime] = useState(null);
  const [newEntriesCount, setNewEntriesCount] = useState(0);

  // Load last viewed time when component mounts
  useEffect(() => {
    const loadLastViewedTime = async () => {
      try {
        const storedTime = await AsyncStorage.getItem('lastInvoiceViewTime');
        if (storedTime) {
          setLastViewedTime(new Date(storedTime));
        }
      } catch (error) {
        console.error('Error loading last viewed time:', error);
      }
    };
    
    loadLastViewedTime();
  }, []);

  // Update last viewed time when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      const updateLastViewedTime = async () => {
        const now = new Date();
        try {
          await AsyncStorage.setItem('lastInvoiceViewTime', now.toISOString());
          // Update state AFTER saving to storage
          setLastViewedTime(now);
          // Reset new entries count when the screen is viewed
          setNewEntriesCount(0);
          await AsyncStorage.setItem('newInvoiceEntriesCount', '0');
        } catch (error) {
          console.error('Error saving last viewed time:', error);
        }
      };
      
      // Introduce a slight delay to ensure the screen is actually viewed
      const timer = setTimeout(() => {
        updateLastViewedTime();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isFocused]); // Only depend on isFocused, not loading

  // Check if an entry is new (created after last viewed time)
  const isNewEntry = (entry) => {
    if (!lastViewedTime) return false;
    
    const entryDate = new Date(entry.createdAt || entry.date || 0);
    return entryDate > lastViewedTime;
  };

  // Fetch inward entries data
  const fetchInwardEntries = async () => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/inward/getAllInward`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch inward entries:', response.status);
        return [];
      }
      
      const data = await response.json();
      // Transform inward entries to activity format
      const transformedData = data.map(entry => ({
        ...entry,
        activityType: 'inward',
        displayTitle: `Inward Entry ${entry.invoiceNo ? `#${entry.invoiceNo}` : ''}`,
        partyName: entry.supplierDetails?.supplierName || 'Unknown Supplier',
        gstNo: entry.supplierDetails?.supplierGSTNo,
        contactNo: entry.supplierDetails?.supplierMobileNo,
        products: entry.productDetails || [],
        amount: entry.amount,
        date: entry.date || entry.createdAt,
        vehicle: entry.transportDetails?.vehicleNumber
      }));
      
      // Sort by creation date (newest first)
      const sortedData = transformedData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
      });
      
      setInwardEntries(sortedData);
      return sortedData;
    } catch (error) {
      console.error('Error fetching inward entries:', error);
      return [];
    }
  };

  // Fetch outward entries data
  const fetchOutwardEntries = async () => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/outward/getAllOutward`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch outward entries:', response.status);
        return [];
      }
      
      const data = await response.json();
      // Transform outward entries to activity format
      const transformedData = data.map(entry => ({
        ...entry,
        activityType: 'outward',
        displayTitle: `Outward Entry ${entry.invoiceNo ? `#${entry.invoiceNo}` : ''}`,
        partyName: entry.customerDetails?.name || 'Unknown Customer',
        gstNo: entry.customerDetails?.gstNo,
        contactNo: entry.customerDetails?.contactNumber,
        products: entry.productDetails || [],
        amount: entry.total,
        date: entry.createdAt,
        paymentType: entry.paymentType,
        outstandingPayment: entry.outstandingPayment,
        vehicle: entry.transportDetails?.vehicleNumber
      }));
      
      // Sort by creation date (newest first)
      const sortedData = transformedData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
      });
      
      setOutwardEntries(sortedData);
      return sortedData;
    } catch (error) {
      console.error('Error fetching outward entries:', error);
      return [];
    }
  };

  // Fetch all data and combine into activity feed
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [inwardData, outwardData] = await Promise.all([
        fetchInwardEntries(),
        fetchOutwardEntries()
      ]);
      
      // Combine and sort by date (newest first)
      const combinedActivities = [...inwardData, ...outwardData].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
      });
      
      setAllActivities(combinedActivities);
      
      // Calculate new entries count (for notification badge)
      // Read the current stored time directly from AsyncStorage to avoid state dependencies
      try {
        const storedTime = await AsyncStorage.getItem('lastInvoiceViewTime');
        if (storedTime) {
          const lastViewed = new Date(storedTime);
          const newCount = combinedActivities.filter(entry => {
            const entryDate = new Date(entry.createdAt || entry.date || 0);
            return entryDate > lastViewed;
          }).length;
          
          // Only update state if the screen is not focused (to avoid loops)
          if (!isFocused) {
            setNewEntriesCount(newCount);
          }
          
          // Always save the count to AsyncStorage for the tab badge
          await AsyncStorage.setItem('newInvoiceEntriesCount', newCount.toString());
        }
      } catch (error) {
        console.error('Error processing new entries count:', error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
    
    // Refresh data every 2 minutes - this will also update the badge count
    const interval = setInterval(fetchAllData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Refresh on pull down
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today - show time only
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      // Within a week - show day name
      return `${date.toLocaleDateString([], { weekday: 'long' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // Older - show full date
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  // Render activity item
  const renderActivityItem = ({ item }) => {
    const isInward = item.activityType === 'inward';
    const isNew = isNewEntry(item);
    
    return (
      <Card 
        style={[
          styles.activityCard, 
          { borderLeftColor: isInward ? '#10B981' : '#3B82F6', borderLeftWidth: 4 },
          isNew && styles.newActivityCard
        ]}
        elevation={2}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.activityTypeIcon}>{isInward ? '📥' : '📤'}</Text>
              <Text style={styles.cardTitle}>
                {item.displayTitle}
              </Text>
              {isNew && (
                <Badge style={styles.newBadge}>NEW</Badge>
              )}
            </View>
            <Text style={styles.cardDate}>{formatDate(item.date || item.createdAt)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{isInward ? 'Supplier:' : 'Customer:'}</Text>
            <Text style={styles.detailValue}>{item.partyName}</Text>
          </View>
          
          {item.contactNo && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact:</Text>
              <Text style={styles.detailValue}>{item.contactNo}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Items:</Text>
            <Text style={styles.detailValue}>
              {item.productDetails?.length || item.products?.length || 0} items
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>
              ₹{(isInward ? item.amount : item.total)?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}
            </Text>
          </View>
          
          {item.vehicle && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle:</Text>
              <Text style={styles.detailValue}>{item.vehicle}</Text>
            </View>
          )}
          
          {!isInward && item.paymentType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment:</Text>
              <Text style={styles.detailValue}>{item.paymentType}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Data to display based on active tab
  const getActiveData = () => {
    switch (activeTab) {
      case 'inward':
        return inwardEntries;
      case 'outward':
        return outwardEntries;
      default:
        return allActivities;
    }
  };

  // Count new entries by type
  const newInwardCount = inwardEntries.filter(isNewEntry).length;
  const newOutwardCount = outwardEntries.filter(isNewEntry).length;
  const newAllCount = allActivities.filter(isNewEntry).length;

  // Render header with tabs
  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Invoice Activity</Text>
        {newAllCount > 0 && (
          <Badge size={24} style={styles.headerBadge}>{newAllCount}</Badge>
        )}
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
          {newAllCount > 0 && (
            <Badge 
              visible={true}
              style={styles.tabBadge}
            >
              {newAllCount}
            </Badge>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'inward' && styles.activeTab]}
          onPress={() => setActiveTab('inward')}
        >
          <Text style={[styles.tabText, activeTab === 'inward' && styles.activeTabText]}>
            Inward
          </Text>
          {newInwardCount > 0 && (
            <Badge 
              visible={true}
              style={[styles.tabBadge, { backgroundColor: '#10B981' }]}
            >
              {newInwardCount}
            </Badge>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'outward' && styles.activeTab]}
          onPress={() => setActiveTab('outward')}
        >
          <Text style={[styles.tabText, activeTab === 'outward' && styles.activeTabText]}>
            Outward
          </Text>
          {newOutwardCount > 0 && (
            <Badge 
              visible={true}
              style={[styles.tabBadge, { backgroundColor: '#3B82F6' }]}
            >
              {newOutwardCount}
            </Badge>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render empty list view
  const renderEmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {activeTab === 'all' 
          ? 'No invoice activity found' 
          : `No ${activeTab} entries found`}
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={onRefresh}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading invoice activity...</Text>
        </View>
      ) : (
        <FlatList
          data={getActiveData()}
          renderItem={renderActivityItem}
          keyExtractor={(item, index) => item._id || `activity-${index}`}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyListComponent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={["#6366f1"]} 
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb"
  },
  header: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    elevation: 2
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827"
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 8,
    marginBottom: 8,
    elevation: 1
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginHorizontal: 4,
    flexDirection: "row"
  },
  activeTab: {
    backgroundColor: "#EBF4FF"
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280"
  },
  activeTabText: {
    color: "#3B82F6"
  },
  tabBadge: {
    backgroundColor: "#6366f1",
    color: "#FFFFFF",
    marginLeft: 8
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80
  },
  activityCard: {
    marginTop: 12,
    borderRadius: 12
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937"
  },
  cardDate: {
    fontSize: 12,
    color: "#6b7280"
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500"
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 14
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: 32,
    borderRadius: 12,
    marginTop: 16
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 16
  },
  activityTypeIcon: {
    fontSize: 18,
    marginRight: 8
  },
  refreshButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#6366f1",
    borderRadius: 8
  },
  refreshButtonText: {
    color: "#ffffff",
    fontWeight: "600"
  },
  newActivityCard: {
    backgroundColor: '#F0FDF4', // Light green background for new entries
  },
  newBadge: {
    backgroundColor: '#10B981',
    color: 'white',
    marginLeft: 8,
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerBadge: {
    backgroundColor: '#EF4444',
    color: 'white',
    position: 'absolute',
    right: 16,
    top: 16,
  },
});