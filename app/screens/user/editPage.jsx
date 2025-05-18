import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import getEnvVars from "../../../config/environment";
const CompanyManagement = () => {
  // State for company data
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const { API_URL } = getEnvVars();
  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    founded_year: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    }
  });

  // Fetch all companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Update form data when a company is selected
  useEffect(() => {
    if (selectedCompany) {
      setFormData({
        name: selectedCompany.name || '',
        industry: selectedCompany.industry || 'Dairy & Food Processing',
        founded_year: selectedCompany.founded_year?.toString() || '',
        email: selectedCompany.email || '',
        phone: selectedCompany.phone || '',
        address: {
          street: selectedCompany.address?.street || '',
          city: selectedCompany.address?.city || '',
          state: selectedCompany.address?.state || '',
          postal_code: selectedCompany.address?.postal_code || '',
          country: selectedCompany.address?.country || 'India'
        }
      });
    }
  }, [selectedCompany]);

  // Fetch all companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/Company-Details`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setCompanies(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch companies: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update company details
  const updateCompany = async () => {
    try {
      setLoading(true);
  
      // Prepare data for update
      const updateData = {
        ...formData,
        // Parse founded_year to a number if it exists
        founded_year: formData.founded_year ? parseInt(formData.founded_year, 10) : undefined
      };
  
      const response = await fetch(`${API_URL}/api/Company-Details/update-Details`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
  
      // Check content type before parsing JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned non-JSON response");
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
  
      const updatedCompany = await response.json();
  
      // Update state with new company data
      setCompanies([updatedCompany]); // Since there's only one company
      setSelectedCompany(updatedCompany);
  
      Alert.alert('Success', 'Company details updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update company: ' + err.message);
      Alert.alert('Error', 'Failed to update company: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form field changes
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested fields like address.street
      const [parent, child] = field.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      // Handle top-level fields
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  // Select a company to edit
  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
  };

  // Reset the form
  const handleReset = () => {
    setSelectedCompany(null);
    setFormData({
      name: '',
      industry: 'Dairy & Food Processing',
      founded_year: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India'
      }
    });
  };

  // Render loading state
  if (loading && !selectedCompany) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text>Loading companies...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Companies List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company List</Text>
        <ScrollView style={styles.companiesList}>
          {companies.length === 0 ? (
            <Text style={styles.noCompaniesText}>No companies found</Text>
          ) : (
            companies.map((company) => (
              <TouchableOpacity
                key={company._id}
                style={[
                  styles.companyItem,
                  selectedCompany?._id === company._id && styles.selectedCompany
                ]}
                onPress={() => handleSelectCompany(company)}
              >
                <Text style={styles.companyName}>{company.name}</Text>
                <Text style={styles.companyEmail}>{company.email}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchCompanies}
        >
          <Text style={styles.buttonText}>Refresh List</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedCompany ? 'Edit Company Details' : 'No Company Selected'}
        </Text>
        
        {selectedCompany && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Company Name*</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Company name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Industry</Text>
              <TextInput
                style={styles.input}
                value={formData.industry}
                onChangeText={(text) => handleInputChange('industry', text)}
                placeholder="Industry"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Founded Year</Text>
              <TextInput
                style={styles.input}
                value={formData.founded_year}
                onChangeText={(text) => handleInputChange('founded_year', text)}
                placeholder="Founded year"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email*</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                placeholder="Email address"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.subSectionTitle}>Address</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Street</Text>
              <TextInput
                style={styles.input}
                value={formData.address.street}
                onChangeText={(text) => handleInputChange('address.street', text)}
                placeholder="Street"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.address.city}
                onChangeText={(text) => handleInputChange('address.city', text)}
                placeholder="City"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={formData.address.state}
                onChangeText={(text) => handleInputChange('address.state', text)}
                placeholder="State"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                style={styles.input}
                value={formData.address.postal_code}
                onChangeText={(text) => handleInputChange('address.postal_code', text)}
                placeholder="Postal code"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                value={formData.address.country}
                onChangeText={(text) => handleInputChange('address.country', text)}
                placeholder="Country"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={updateCompany}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Update Company</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
              >
                <Text style={styles.resetButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  companiesList: {
    maxHeight: 200,
  },
  companyItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedCompany: {
    backgroundColor: '#e6f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  companyEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  noCompaniesText: {
    textAlign: 'center',
    padding: 16,
    color: '#999',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  updateButton: {
    backgroundColor: '#1890ff',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  refreshButton: {
    backgroundColor: '#52c41a',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  resetButton: {
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#fff2f0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
  errorText: {
    color: '#f5222d',
  },
});

export default CompanyManagement;