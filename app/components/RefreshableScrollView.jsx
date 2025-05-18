import React, { useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';

const RefreshableScrollView = ({ children, onRefresh, style }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={style}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#000000']}
          tintColor="#000000"
        />
      }
    >
      {children}
    </ScrollView>
  );
};

export default RefreshableScrollView; 