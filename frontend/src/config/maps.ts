export const GOOGLE_MAPS_API_KEY = 'AIzaSyAiyXTtM-9uyNKMundun3DA8IT9b8xq_HU';

export const CITY_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  // Metros & Tier 1
  'Mumbai': { lat: 19.0760, lng: 72.8777, zoom: 12 },
  'Delhi': { lat: 28.6139, lng: 77.2090, zoom: 11 },
  'Bengaluru': { lat: 12.9716, lng: 77.5946, zoom: 12 },
  'Bangalore': { lat: 12.9716, lng: 77.5946, zoom: 12 },
  'Kolkata': { lat: 22.5726, lng: 88.3639, zoom: 12 },
  'Chennai': { lat: 13.0827, lng: 80.2707, zoom: 12 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867, zoom: 12 },
  'Pune': { lat: 18.5204, lng: 73.8567, zoom: 12 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714, zoom: 12 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794, zoom: 13 },

  // Maharashtra
  'Thane': { lat: 19.2183, lng: 72.9781, zoom: 13 },
  'Navi Mumbai': { lat: 19.0330, lng: 73.0297, zoom: 12 },
  'Nagpur': { lat: 21.1458, lng: 79.0882, zoom: 12 },
  'Nashik': { lat: 19.9975, lng: 73.7898, zoom: 12 },
  'Aurangabad': { lat: 19.8762, lng: 75.3433, zoom: 12 },
  'Chhatrapati Sambhaji Nagar': { lat: 19.8762, lng: 75.3433, zoom: 12 },
  'Solapur': { lat: 17.6599, lng: 75.9064, zoom: 12 },
  'Kolhapur': { lat: 16.7028, lng: 74.2405, zoom: 12 },
  'Ratnagiri': { lat: 16.9934, lng: 73.2954, zoom: 12 },
  'Chiplun': { lat: 17.5330, lng: 73.5123, zoom: 12 },
  'Satara': { lat: 17.6805, lng: 74.0183, zoom: 12 },
  'Sangli': { lat: 16.8524, lng: 74.5815, zoom: 12 },
  'Ahmednagar': { lat: 19.0952, lng: 74.7496, zoom: 12 },
  'Jalgaon': { lat: 21.0077, lng: 75.5626, zoom: 12 },
  'Dhule': { lat: 20.9042, lng: 74.7749, zoom: 12 },
  'Nanded': { lat: 19.1383, lng: 77.3210, zoom: 12 },
  'Latur': { lat: 18.4088, lng: 76.5604, zoom: 12 },
  'Parbhani': { lat: 19.2644, lng: 76.7767, zoom: 12 },
  'Jalna': { lat: 19.8410, lng: 75.8864, zoom: 12 },
  'Beed': { lat: 18.9891, lng: 75.7601, zoom: 12 },
  'Chandrapur': { lat: 19.9615, lng: 79.2961, zoom: 12 },
  'Akola': { lat: 20.7002, lng: 77.0082, zoom: 12 },
  'Amravati': { lat: 20.9374, lng: 77.7796, zoom: 12 },
  'Wardha': { lat: 20.7453, lng: 78.6022, zoom: 12 },
  'Gondia': { lat: 21.4624, lng: 80.1961, zoom: 12 },
  'Alibaug': { lat: 18.6414, lng: 72.8722, zoom: 13 },
  'Khandala': { lat: 18.7614, lng: 73.3742, zoom: 13 },
  'Lonavala': { lat: 18.7557, lng: 73.4091, zoom: 13 },
  'Mahabaleshwar': { lat: 17.9237, lng: 73.6586, zoom: 13 },
  'Panchgani': { lat: 17.9254, lng: 73.8016, zoom: 13 },
  'Shirdi': { lat: 19.7645, lng: 74.4762, zoom: 13 },
  'Matheran': { lat: 18.9865, lng: 73.2687, zoom: 14 },
  'Karjat': { lat: 18.9100, lng: 73.3283, zoom: 13 },
  'Panvel': { lat: 18.9894, lng: 73.1175, zoom: 13 },
  'Vasai': { lat: 19.3919, lng: 72.8397, zoom: 12 },
  'Virar': { lat: 19.4564, lng: 72.8105, zoom: 12 },
  'Dombivli': { lat: 19.2184, lng: 73.0867, zoom: 13 },
  'Kalyan': { lat: 19.2403, lng: 73.1305, zoom: 13 },
  'Malegaon': { lat: 20.5534, lng: 74.5298, zoom: 12 },
  'Ichalkaranji': { lat: 16.6924, lng: 74.4578, zoom: 12 },
  'Sindhudurg': { lat: 16.1264, lng: 73.5703, zoom: 11 },
  'Sawantwadi': { lat: 15.9064, lng: 73.8219, zoom: 13 },
  'Malvan': { lat: 16.0617, lng: 73.4686, zoom: 13 },
  'Kankavli': { lat: 16.2692, lng: 73.7126, zoom: 13 },
  'Kudal': { lat: 16.0089, lng: 73.6892, zoom: 13 },
  'Vengurla': { lat: 15.8600, lng: 73.6300, zoom: 13 },
  'Palghar': { lat: 19.6967, lng: 72.7699, zoom: 12 },
  'Boisar': { lat: 19.8000, lng: 72.7500, zoom: 13 },
  'Dahanu': { lat: 19.9700, lng: 72.7300, zoom: 13 },
  'Bhiwandi': { lat: 19.2967, lng: 73.0631, zoom: 13 },
  'Ulhasnagar': { lat: 19.2215, lng: 73.1645, zoom: 13 },
  'Badlapur': { lat: 19.1663, lng: 73.2368, zoom: 13 },
  'Ambernath': { lat: 19.2017, lng: 73.1895, zoom: 13 },
  'Igatpuri': { lat: 19.6980, lng: 73.5606, zoom: 13 },
  'Sinnar': { lat: 19.8517, lng: 73.9989, zoom: 13 },
  'Sangamner': { lat: 19.5772, lng: 74.2081, zoom: 13 },
  'Kopargaon': { lat: 19.8872, lng: 74.4789, zoom: 13 },
  'Shahapur': { lat: 19.4526, lng: 73.3283, zoom: 13 },
  'Khopoli': { lat: 18.7887, lng: 73.3444, zoom: 13 },
  'Pen': { lat: 18.7358, lng: 73.0941, zoom: 13 },
  'Roha': { lat: 18.4357, lng: 73.1187, zoom: 13 },
  'Mangaon': { lat: 18.2514, lng: 73.2872, zoom: 13 },
  'Mahad': { lat: 18.0831, lng: 73.4189, zoom: 13 },
  'Khed': { lat: 17.7214, lng: 73.3892, zoom: 13 },
  'Guhagar': { lat: 17.4883, lng: 73.1932, zoom: 13 },
  'Rajapur': { lat: 16.6568, lng: 73.5192, zoom: 13 },
  'Karad': { lat: 17.2889, lng: 74.1818, zoom: 12 },
  'Baramati': { lat: 18.1519, lng: 74.5770, zoom: 13 },
  'Phaltan': { lat: 17.9856, lng: 74.4356, zoom: 13 },
  'Pandharpur': { lat: 17.6775, lng: 75.3235, zoom: 13 },
  'Dharashiv': { lat: 18.1861, lng: 76.0419, zoom: 12 },
  'Osmanabad': { lat: 18.1861, lng: 76.0419, zoom: 12 },
  'Barshi': { lat: 18.2327, lng: 75.6947, zoom: 13 },
  'Manmad': { lat: 20.2505, lng: 74.4367, zoom: 13 },

  // Goa
  'Goa': { lat: 15.2993, lng: 74.1240, zoom: 11 },
  'Panaji': { lat: 15.4909, lng: 73.8278, zoom: 13 },
  'Margao': { lat: 15.2832, lng: 73.9862, zoom: 13 },
  'Vasco da Gama': { lat: 15.3982, lng: 73.8113, zoom: 13 },
  'Mapusa': { lat: 15.5937, lng: 73.8142, zoom: 13 },
  'Calangute': { lat: 15.5439, lng: 73.7554, zoom: 13 },
  'Candolim': { lat: 15.5178, lng: 73.7667, zoom: 13 },

  // Gujarat
  'Surat': { lat: 21.1702, lng: 72.8311, zoom: 12 },
  'Vadodara': { lat: 22.3072, lng: 73.1812, zoom: 12 },
  'Padra': { lat: 22.2405, lng: 73.0805, zoom: 13 },
  'Karjan': { lat: 22.0522, lng: 73.0202, zoom: 13 },
  'Dabhoi': { lat: 22.1800, lng: 73.4300, zoom: 13 },
  'Waghodia': { lat: 22.3025, lng: 73.4244, zoom: 13 },
  'Halol': { lat: 22.5022, lng: 73.4708, zoom: 13 },
  'Kalol': { lat: 23.2376, lng: 72.4977, zoom: 13 },
  'Ankleshwar': { lat: 21.6264, lng: 73.0033, zoom: 13 },
  'Bardoli': { lat: 21.1197, lng: 73.1147, zoom: 13 },
  'Bilimora': { lat: 20.7634, lng: 72.9669, zoom: 13 },
  'Daman': { lat: 20.3974, lng: 72.8328, zoom: 13 },
  'Silvassa': { lat: 20.2763, lng: 73.0083, zoom: 13 },
  'Rajkot': { lat: 22.3039, lng: 70.8022, zoom: 12 },
  'Bhavnagar': { lat: 21.7645, lng: 72.1519, zoom: 12 },
  'Jamnagar': { lat: 22.4707, lng: 70.0577, zoom: 12 },
  'Junagadh': { lat: 21.5222, lng: 70.4579, zoom: 12 },
  'Gandhinagar': { lat: 23.2156, lng: 72.6369, zoom: 12 },
  'Anand': { lat: 22.5645, lng: 72.9289, zoom: 12 },
  'Navsari': { lat: 20.9467, lng: 72.9520, zoom: 12 },
  'Morbi': { lat: 22.8120, lng: 70.8377, zoom: 12 },
  'Nadiad': { lat: 22.6916, lng: 72.8634, zoom: 12 },
  'Bharuch': { lat: 21.7051, lng: 72.9959, zoom: 12 },
  'Vapi': { lat: 20.3709, lng: 72.9106, zoom: 12 },
  'Valsad': { lat: 20.5992, lng: 72.9342, zoom: 12 },
  'Godhra': { lat: 22.7750, lng: 73.6149, zoom: 12 },
  'Dahod': { lat: 22.8378, lng: 74.2587, zoom: 12 },
  'Porbandar': { lat: 21.6417, lng: 69.6293, zoom: 12 },
  'Somnath': { lat: 20.8880, lng: 70.4013, zoom: 13 },
  'Veraval': { lat: 20.9080, lng: 70.3688, zoom: 13 },
  'Dwarka': { lat: 22.2442, lng: 68.9685, zoom: 13 },
  'Bhuj': { lat: 23.2420, lng: 69.6669, zoom: 12 },
  'Gandhidham': { lat: 23.0753, lng: 70.1337, zoom: 12 },
  'Kandla': { lat: 23.0100, lng: 70.2186, zoom: 12 },
  'Mundra': { lat: 22.8384, lng: 69.7289, zoom: 12 },
  'Anjar': { lat: 23.1137, lng: 70.0279, zoom: 12 },
  'Mandvi': { lat: 22.8339, lng: 69.3558, zoom: 13 },
  'Mehsana': { lat: 23.5880, lng: 72.3693, zoom: 12 },
  'Palanpur': { lat: 24.1724, lng: 72.4346, zoom: 12 },
  'Patan': { lat: 23.8493, lng: 72.1266, zoom: 12 },
  'Himatnagar': { lat: 23.5977, lng: 72.9658, zoom: 12 },
  'Modasa': { lat: 23.4631, lng: 73.3006, zoom: 12 },
  'Surendranagar': { lat: 22.7277, lng: 71.6370, zoom: 12 },
  'Amreli': { lat: 21.6032, lng: 71.2223, zoom: 12 },
  'Botad': { lat: 22.1706, lng: 71.6669, zoom: 12 },
  'Gondal': { lat: 21.9619, lng: 70.7937, zoom: 12 },
  'Jetpur': { lat: 21.7547, lng: 70.6276, zoom: 12 },
  'Keshod': { lat: 21.3032, lng: 70.2520, zoom: 12 },
  'Una': { lat: 20.8258, lng: 71.0408, zoom: 12 },
  'Mahuva': { lat: 21.0914, lng: 71.7634, zoom: 12 },

  // Rajasthan
  'Jaipur': { lat: 26.9124, lng: 75.7873, zoom: 12 },
  'Jodhpur': { lat: 26.2389, lng: 73.0243, zoom: 12 },
  'Kota': { lat: 25.2138, lng: 75.8648, zoom: 12 },
  'Udaipur': { lat: 24.5854, lng: 73.7125, zoom: 12 },
  'Bikaner': { lat: 28.0229, lng: 73.3119, zoom: 12 },
  'Ajmer': { lat: 26.4499, lng: 74.6399, zoom: 12 },
  'Bhilwara': { lat: 25.3407, lng: 74.6313, zoom: 12 },
  'Alwar': { lat: 27.5530, lng: 76.6346, zoom: 12 },
  'Sikar': { lat: 27.6094, lng: 75.1398, zoom: 12 },
  'Bharatpur': { lat: 27.2152, lng: 77.5030, zoom: 12 },
  'Pali': { lat: 25.7711, lng: 73.3234, zoom: 12 },
  'Chittorgarh': { lat: 24.8887, lng: 74.6269, zoom: 12 },
  'Mount Abu': { lat: 24.5926, lng: 72.7156, zoom: 13 },
  'Jaisalmer': { lat: 26.9157, lng: 70.9083, zoom: 12 },
  'Pushkar': { lat: 26.4897, lng: 74.5511, zoom: 13 },

  // Karnataka
  'Mysore': { lat: 12.2958, lng: 76.6394, zoom: 12 },
  'Hubli': { lat: 15.3647, lng: 75.1240, zoom: 12 },
  'Dharwad': { lat: 15.4589, lng: 75.0078, zoom: 12 },
  'Belgaum': { lat: 15.8497, lng: 74.4977, zoom: 12 },
  'Mangalore': { lat: 12.9141, lng: 74.8560, zoom: 12 },
  'Gulbarga': { lat: 17.3297, lng: 76.8343, zoom: 12 },
  'Kalaburagi': { lat: 17.3297, lng: 76.8343, zoom: 12 },
  'Davanagere': { lat: 14.4644, lng: 75.9218, zoom: 12 },
  'Bellary': { lat: 15.1394, lng: 76.9214, zoom: 12 },
  'Shimoga': { lat: 13.9299, lng: 75.5681, zoom: 12 },
  'Shivamogga': { lat: 13.9299, lng: 75.5681, zoom: 12 },
  'Tumkur': { lat: 13.3409, lng: 77.1010, zoom: 12 },
  'Bidar': { lat: 17.9104, lng: 77.5199, zoom: 12 },
  'Hospet': { lat: 15.2689, lng: 76.3909, zoom: 12 },
  'Hassan': { lat: 13.0033, lng: 76.1004, zoom: 12 },
  'Gadag': { lat: 15.4167, lng: 75.6333, zoom: 12 },
  'Udupi': { lat: 13.3409, lng: 74.7421, zoom: 12 },
  'Kolar': { lat: 13.1367, lng: 78.1291, zoom: 12 },
  'Mandya': { lat: 12.5218, lng: 76.8951, zoom: 12 },
  'Chikmagalur': { lat: 13.3161, lng: 75.7720, zoom: 13 },
  'Gokarna': { lat: 14.5479, lng: 74.3188, zoom: 13 },
  'Hampi': { lat: 15.3350, lng: 76.4600, zoom: 13 },
  'Coorg': { lat: 12.4244, lng: 75.7382, zoom: 12 },
  'Madikeri': { lat: 12.4244, lng: 75.7382, zoom: 12 },

  // Tamil Nadu
  'Coimbatore': { lat: 11.0168, lng: 76.9558, zoom: 12 },
  'Madurai': { lat: 9.9252, lng: 78.1198, zoom: 12 },
  'Tiruchirappalli': { lat: 10.7905, lng: 78.7047, zoom: 12 },
  'Trichy': { lat: 10.7905, lng: 78.7047, zoom: 12 },
  'Salem': { lat: 11.6643, lng: 78.1460, zoom: 12 },
  'Tirunelveli': { lat: 8.7139, lng: 77.7567, zoom: 12 },
  'Tiruppur': { lat: 11.1085, lng: 77.3411, zoom: 12 },
  'Vellore': { lat: 12.9165, lng: 79.1325, zoom: 12 },
  'Erode': { lat: 11.3410, lng: 77.7172, zoom: 12 },
  'Thoothukudi': { lat: 8.7642, lng: 78.1348, zoom: 12 },
  'Dindigul': { lat: 10.3673, lng: 77.9803, zoom: 12 },
  'Thanjavur': { lat: 10.7870, lng: 79.1378, zoom: 12 },
  'Ranipet': { lat: 12.9246, lng: 79.3308, zoom: 12 },
  'Kanchipuram': { lat: 12.8342, lng: 79.7036, zoom: 12 },
  'Ooty': { lat: 11.4102, lng: 76.6950, zoom: 13 },
  'Kodaikanal': { lat: 10.2381, lng: 77.4892, zoom: 13 },
  'Rameshwaram': { lat: 9.2876, lng: 79.3129, zoom: 13 },
  'Kanyakumari': { lat: 8.0883, lng: 77.5385, zoom: 13 },
  'Tiruvannamalai': { lat: 12.2253, lng: 79.0747, zoom: 12 },
  'Hosur': { lat: 12.7409, lng: 77.8253, zoom: 12 },
  'Nagercoil': { lat: 8.1833, lng: 77.4119, zoom: 12 },
  'Cuddalore': { lat: 11.7480, lng: 79.7714, zoom: 12 },
  'Pondicherry': { lat: 11.9416, lng: 79.8083, zoom: 12 },

  // Kerala
  'Kochi': { lat: 9.9312, lng: 76.2673, zoom: 12 },
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366, zoom: 12 },
  'Trivandrum': { lat: 8.5241, lng: 76.9366, zoom: 12 },
  'Kozhikode': { lat: 11.2588, lng: 75.7804, zoom: 12 },
  'Calicut': { lat: 11.2588, lng: 75.7804, zoom: 12 },
  'Kollam': { lat: 8.8932, lng: 76.6141, zoom: 12 },
  'Thrissur': { lat: 10.5276, lng: 76.2144, zoom: 12 },
  'Kannur': { lat: 11.8745, lng: 75.3704, zoom: 12 },
  'Alappuzha': { lat: 9.4981, lng: 76.3388, zoom: 12 },
  'Kottayam': { lat: 9.5916, lng: 76.5222, zoom: 12 },
  'Palakkad': { lat: 10.7867, lng: 76.6548, zoom: 12 },
  'Malappuram': { lat: 11.0732, lng: 76.0740, zoom: 12 },
  'Munnar': { lat: 10.0889, lng: 77.0595, zoom: 13 },
  'Wayanad': { lat: 11.6050, lng: 76.0828, zoom: 12 },
  'Varkala': { lat: 8.7379, lng: 76.7163, zoom: 13 },
  'Kasaragod': { lat: 12.5102, lng: 74.9852, zoom: 12 },

  // Andhra Pradesh & Telangana
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185, zoom: 12 },
  'Vijayawada': { lat: 16.5062, lng: 80.6480, zoom: 12 },
  'Guntur': { lat: 16.3067, lng: 80.4365, zoom: 12 },
  'Nellore': { lat: 14.4426, lng: 79.9865, zoom: 12 },
  'Kurnool': { lat: 15.8281, lng: 78.0373, zoom: 12 },
  'Rajahmundry': { lat: 17.0005, lng: 81.8040, zoom: 12 },
  'Tirupati': { lat: 13.6288, lng: 79.4192, zoom: 12 },
  'Kadapa': { lat: 14.4673, lng: 78.8242, zoom: 12 },
  'Kakinada': { lat: 16.9891, lng: 82.2475, zoom: 12 },
  'Anantapur': { lat: 14.6819, lng: 77.6006, zoom: 12 },
  'Secunderabad': { lat: 17.4399, lng: 78.4983, zoom: 12 },
  'Warangal': { lat: 17.9689, lng: 79.5941, zoom: 12 },
  'Nizamabad': { lat: 18.6725, lng: 78.0941, zoom: 12 },
  'Karimnagar': { lat: 18.4386, lng: 79.1288, zoom: 12 },
  'Khammam': { lat: 17.2473, lng: 80.1514, zoom: 12 },

  // Delhi NCR, Punjab & Haryana
  'Gurgaon': { lat: 28.4595, lng: 77.0266, zoom: 12 },
  'Gurugram': { lat: 28.4595, lng: 77.0266, zoom: 12 },
  'Noida': { lat: 28.5355, lng: 77.3910, zoom: 12 },
  'Greater Noida': { lat: 28.4744, lng: 77.5040, zoom: 12 },
  'Faridabad': { lat: 28.4089, lng: 77.3178, zoom: 12 },
  'Ghaziabad': { lat: 28.6692, lng: 77.4538, zoom: 12 },
  'Ludhiana': { lat: 30.9010, lng: 75.8573, zoom: 12 },
  'Amritsar': { lat: 31.6340, lng: 74.8723, zoom: 12 },
  'Jalandhar': { lat: 31.3260, lng: 75.5762, zoom: 12 },
  'Patiala': { lat: 30.3398, lng: 76.3869, zoom: 12 },
  'Bathinda': { lat: 30.2110, lng: 74.9455, zoom: 12 },
  'Panipat': { lat: 29.3909, lng: 76.9635, zoom: 12 },
  'Sonipat': { lat: 28.9931, lng: 77.0151, zoom: 12 },
  'Rohtak': { lat: 28.8955, lng: 76.6066, zoom: 12 },
  'Karnal': { lat: 29.6857, lng: 76.9905, zoom: 12 },
  'Hisar': { lat: 29.1492, lng: 75.7217, zoom: 12 },
  'Ambala': { lat: 30.3782, lng: 76.7767, zoom: 12 },
  'Mohali': { lat: 30.7046, lng: 76.7179, zoom: 12 },
  'Panchkula': { lat: 30.6942, lng: 76.8606, zoom: 12 },

  // Uttar Pradesh & Uttarakhand
  'Lucknow': { lat: 26.8467, lng: 80.9462, zoom: 12 },
  'Kanpur': { lat: 26.4499, lng: 80.3319, zoom: 12 },
  'Varanasi': { lat: 25.3176, lng: 82.9739, zoom: 12 },
  'Agra': { lat: 27.1767, lng: 78.0081, zoom: 12 },
  'Prayagraj': { lat: 25.4358, lng: 81.8463, zoom: 12 },
  'Allahabad': { lat: 25.4358, lng: 81.8463, zoom: 12 },
  'Meerut': { lat: 28.9845, lng: 77.7064, zoom: 12 },
  'Bareilly': { lat: 28.3670, lng: 79.4304, zoom: 12 },
  'Aligarh': { lat: 27.8974, lng: 78.0880, zoom: 12 },
  'Moradabad': { lat: 28.8386, lng: 78.7733, zoom: 12 },
  'Saharanpur': { lat: 29.9640, lng: 77.5460, zoom: 12 },
  'Gorakhpur': { lat: 26.7606, lng: 83.3732, zoom: 12 },
  'Jhansi': { lat: 25.4484, lng: 78.5685, zoom: 12 },
  'Muzaffarnagar': { lat: 29.4727, lng: 77.7085, zoom: 12 },
  'Mathura': { lat: 27.4924, lng: 77.6737, zoom: 12 },
  'Ayodhya': { lat: 26.7922, lng: 82.1998, zoom: 12 },
  'Vrindavan': { lat: 27.5806, lng: 77.7006, zoom: 12 },
  'Dehradun': { lat: 30.3165, lng: 78.0322, zoom: 12 },
  'Haridwar': { lat: 29.9457, lng: 78.1642, zoom: 12 },
  'Rishikesh': { lat: 30.0869, lng: 78.2676, zoom: 12 },
  'Roorkee': { lat: 29.8543, lng: 77.8880, zoom: 12 },
  'Nainital': { lat: 29.3919, lng: 79.4542, zoom: 13 },
  'Mussoorie': { lat: 30.4598, lng: 78.0644, zoom: 13 },
  'Haldwani': { lat: 29.2183, lng: 79.5130, zoom: 12 },

  // Himachal Pradesh, J&K, Ladakh
  'Shimla': { lat: 31.1048, lng: 77.1734, zoom: 12 },
  'Manali': { lat: 32.2432, lng: 77.1892, zoom: 12 },
  'Dharamshala': { lat: 32.2190, lng: 76.3234, zoom: 12 },
  'Kullu': { lat: 31.9579, lng: 77.1095, zoom: 12 },
  'Solan': { lat: 30.9045, lng: 77.0967, zoom: 12 },
  'Srinagar': { lat: 34.0837, lng: 74.7973, zoom: 12 },
  'Jammu': { lat: 32.7266, lng: 74.8570, zoom: 12 },
  'Katra': { lat: 32.9917, lng: 74.9318, zoom: 13 },
  'Leh': { lat: 34.1526, lng: 77.5771, zoom: 12 },

  // Madhya Pradesh & Chhattisgarh
  'Bhopal': { lat: 23.2599, lng: 77.4126, zoom: 12 },
  'Indore': { lat: 22.7196, lng: 75.8577, zoom: 12 },
  'Jabalpur': { lat: 23.1815, lng: 79.9864, zoom: 12 },
  'Gwalior': { lat: 26.2183, lng: 78.1828, zoom: 12 },
  'Ujjain': { lat: 23.1765, lng: 75.7885, zoom: 12 },
  'Sagar': { lat: 23.8388, lng: 78.7378, zoom: 12 },
  'Raipur': { lat: 21.2514, lng: 81.6296, zoom: 12 },
  'Bhilai': { lat: 21.1938, lng: 81.3509, zoom: 12 },
  'Bilaspur': { lat: 22.0797, lng: 82.1409, zoom: 12 },

  // Bihar, Jharkhand, West Bengal, Odisha
  'Patna': { lat: 25.5941, lng: 85.1376, zoom: 12 },
  'Gaya': { lat: 24.7914, lng: 85.0002, zoom: 12 },
  'Bhagalpur': { lat: 25.2425, lng: 86.9842, zoom: 12 },
  'Muzaffarpur': { lat: 26.1209, lng: 85.3647, zoom: 12 },
  'Ranchi': { lat: 23.3441, lng: 85.3096, zoom: 12 },
  'Jamshedpur': { lat: 22.8046, lng: 86.2029, zoom: 12 },
  'Dhanbad': { lat: 23.7957, lng: 86.4304, zoom: 12 },
  'Bokaro': { lat: 23.6693, lng: 86.1511, zoom: 12 },
  'Howrah': { lat: 22.5958, lng: 88.2636, zoom: 12 },
  'Durgapur': { lat: 23.5204, lng: 87.3119, zoom: 12 },
  'Asansol': { lat: 23.6889, lng: 86.9661, zoom: 12 },
  'Siliguri': { lat: 26.7271, lng: 88.3953, zoom: 12 },
  'Darjeeling': { lat: 27.0410, lng: 88.2663, zoom: 13 },
  'Kharagpur': { lat: 22.3398, lng: 87.3253, zoom: 12 },
  'Bhubaneswar': { lat: 20.2961, lng: 85.8245, zoom: 12 },
  'Cuttack': { lat: 20.4625, lng: 85.8828, zoom: 12 },
  'Rourkela': { lat: 22.2604, lng: 84.8536, zoom: 12 },
  'Puri': { lat: 19.8135, lng: 85.8312, zoom: 13 },
  'Sambalpur': { lat: 21.4669, lng: 83.9812, zoom: 12 },

  // North East
  'Guwahati': { lat: 26.1445, lng: 91.7362, zoom: 12 },
  'Shillong': { lat: 25.5788, lng: 91.8933, zoom: 12 },
  'Gangtok': { lat: 27.3389, lng: 88.6065, zoom: 12 },
  'Agartala': { lat: 23.8315, lng: 91.2868, zoom: 12 },
  'Imphal': { lat: 24.8170, lng: 93.9368, zoom: 12 },
  'Aizawl': { lat: 23.7271, lng: 92.7176, zoom: 12 },
  'Kohima': { lat: 25.6751, lng: 94.1086, zoom: 12 },
};

// In-memory cache for dynamically resolved towns
const dynamicGeoCache: Record<string, { lat: number; lng: number; zoom: number }> = {};

/**
 * Universally resolve coordinates for any Indian city, town, or waypoint.
 * Checks local dictionary first (instant), then queries backend /api/geo/lookup,
 * falling back to Open-Meteo geocoding. Caches results dynamically.
 */
export async function lookupCoordinatesAsync(
  name?: string
): Promise<{ lat: number; lng: number; zoom: number } | null> {
  if (!name) return null;
  const clean = name.trim();
  if (!clean) return null;

  // 1. Direct match in local dictionary
  if (CITY_COORDINATES[clean]) return CITY_COORDINATES[clean];
  const foundKey = Object.keys(CITY_COORDINATES).find(
    (k) => k.toLowerCase() === clean.toLowerCase()
  );
  if (foundKey) return CITY_COORDINATES[foundKey];

  // 2. Dynamic in-memory cache
  const cacheKey = clean.toLowerCase();
  if (dynamicGeoCache[cacheKey]) {
    return dynamicGeoCache[cacheKey];
  }

  // 3. Query backend universal geocoding API
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/geo/lookup?query=${encodeURIComponent(clean)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.found && typeof data.lat === 'number' && typeof data.lng === 'number') {
        const item = { lat: data.lat, lng: data.lng, zoom: data.zoom || 12 };
        dynamicGeoCache[cacheKey] = item;
        return item;
      }
    }
  } catch {
    // Backend offline or unreachable, fall through to direct fallback
  }

  // 4. Direct Open-Meteo Geocoding Fallback with India validation
  try {
    const omRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=10&language=en&format=json`
    );
    if (omRes.ok) {
      const omData = await omRes.json();
      if (omData.results && omData.results.length > 0) {
        // Prioritize Indian results
        const inResults = omData.results.filter(
          (r: any) => r.country_code === 'IN' || r.country === 'India'
        );
        const match = inResults.length > 0 ? inResults[0] : omData.results[0];
        const item = {
          lat: Number(match.latitude),
          lng: Number(match.longitude),
          zoom: 12,
        };
        dynamicGeoCache[cacheKey] = item;
        return item;
      }
    }
  } catch {
    // Ignore fallback failure
  }

  return null;
}

export const DEFAULT_MAP_CENTER = { lat: 20.5937, lng: 78.9629, zoom: 5 };

// Modern, crisp light Google Maps theme styling that matches our executive UI
export const CLEAN_LIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#94A3B8' }, { weight: 1.2 }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#CBD5E1' }, { weight: 1 }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [{ color: '#F8FAFC' }],
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E2E8F0' }, { weight: 0.8 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#FED7AA' }], // Subtle warm amber for highways
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#FDBA74' }, { weight: 1 }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.fill',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#E0F2FE' }], // Soft crisp blue water
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0284C7' }],
  },
];
