// Flutter Example - API Client
// File: lib/services/api_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseURL = 'http://localhost:3000/api';

  Future<Map<String, dynamic>> request(String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    final url = Uri.parse('$baseURL$endpoint');
    
    final requestHeaders = {
      'Content-Type': 'application/json',
      ...?headers,
    };

    try {
      http.Response response;
      
      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(url, headers: requestHeaders);
          break;
        case 'POST':
          response = await http.post(
            url,
            headers: requestHeaders,
            body: body != null ? json.encode(body) : null,
          );
          break;
        case 'PUT':
          response = await http.put(
            url,
            headers: requestHeaders,
            body: body != null ? json.encode(body) : null,
          );
          break;
        case 'DELETE':
          response = await http.delete(url, headers: requestHeaders);
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }

      final data = json.decode(response.body);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return data;
      } else {
        throw Exception(data['error'] ?? 'HTTP error! status: ${response.statusCode}');
      }
    } catch (error) {
      print('API request failed: $error');
      rethrow;
    }
  }

  // Volunteers
  Future<Map<String, dynamic>> getVolunteers({String? query}) async {
    final params = query != null ? '?q=${Uri.encodeComponent(query)}' : '';
    return request('/volunteers$params');
  }

  Future<Map<String, dynamic>> createVolunteer({
    required String fullName,
    required String email,
    String? phone,
  }) async {
    return request('/volunteers', method: 'POST', body: {
      'full_name': fullName,
      'email': email,
      'phone': phone,
    });
  }

  // Site Reports
  Future<Map<String, dynamic>> getSiteReports({String? query}) async {
    final params = query != null ? '?q=${Uri.encodeComponent(query)}' : '';
    return request('/site-reports$params');
  }

  Future<Map<String, dynamic>> createSiteReport({
    int? volunteerId,
    int? disasterTypeId,
    String? villageId,
    String? reportDate,
    String? status,
  }) async {
    return request('/site-reports', method: 'POST', body: {
      'volunteer_id': volunteerId,
      'disaster_type_id': disasterTypeId,
      'village_id': villageId,
      'report_date': reportDate,
      'status': status,
    });
  }

  Future<Map<String, dynamic>> getSiteReport(int id) async {
    return request('/site-reports/$id');
  }

  // Distributions
  Future<Map<String, dynamic>> getDistributions({String? query}) async {
    final params = query != null ? '?q=${Uri.encodeComponent(query)}' : '';
    return request('/distributions$params');
  }

  Future<Map<String, dynamic>> createDistribution({
    int? volunteerId,
    String? villageId,
    required String recipientName,
    String? recipientPhone,
    required String items,
    int? quantity,
    String? distributionDate,
    String? status,
    String? notes,
  }) async {
    return request('/distributions', method: 'POST', body: {
      'volunteer_id': volunteerId,
      'village_id': villageId,
      'recipient_name': recipientName,
      'recipient_phone': recipientPhone,
      'items': items,
      'quantity': quantity,
      'distribution_date': distributionDate,
      'status': status,
      'notes': notes,
    });
  }

  // Options
  Future<Map<String, dynamic>> getOptions() async {
    return request('/options');
  }
}

// Usage Example in Flutter Widget
/*
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class VolunteersScreen extends StatefulWidget {
  @override
  _VolunteersScreenState createState() => _VolunteersScreenState();
}

class _VolunteersScreenState extends State<VolunteersScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> volunteers = [];
  bool loading = true;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadVolunteers();
  }

  Future<void> loadVolunteers({String? query}) async {
    try {
      setState(() => loading = true);
      final response = await _apiService.getVolunteers(query: query);
      if (response['success'] == true) {
        setState(() {
          volunteers = response['data'] ?? [];
        });
      }
    } catch (error) {
      print('Error loading volunteers: $error');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading volunteers: $error')),
      );
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> createVolunteer() async {
    try {
      final response = await _apiService.createVolunteer(
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '081234567890',
      );
      
      if (response['success'] == true) {
        loadVolunteers(); // Reload data
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Volunteer created successfully')),
        );
      }
    } catch (error) {
      print('Error creating volunteer: $error');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error creating volunteer: $error')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Volunteers'),
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                labelText: 'Search volunteers...',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => loadVolunteers(query: _searchController.text),
                    child: Text('Search'),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: createVolunteer,
                    child: Text('Create Volunteer'),
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),
            Expanded(
              child: loading
                  ? Center(child: CircularProgressIndicator())
                  : ListView.builder(
                      itemCount: volunteers.length,
                      itemBuilder: (context, index) {
                        final volunteer = volunteers[index];
                        return Card(
                          child: ListTile(
                            title: Text(volunteer['full_name'] ?? ''),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(volunteer['email'] ?? ''),
                                Text(volunteer['phone'] ?? ''),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
*/

















