// Major Indian cities with well-known areas. Used by the location picker (so any city can be chosen even
// before a seller lists there) and as suggestions in the seller sign-up / shop profile forms.
// Live counts per area come from GET /api/locations.

export const INDIA = [
  { city: 'Mumbai', state: 'Maharashtra', areas: ['Bandra West', 'Andheri West', 'Powai', 'Colaba', 'Dadar', 'Juhu', 'Borivali', 'Thane'] },
  { city: 'Delhi', state: 'Delhi', areas: ['Karol Bagh', 'Connaught Place', 'Lajpat Nagar', 'Saket', 'Dwarka', 'Rohini', 'Hauz Khas', 'Chandni Chowk'] },
  { city: 'Bengaluru', state: 'Karnataka', areas: ['Koramangala', 'Indiranagar', 'HSR Layout', 'Jayanagar', 'Whitefield', 'Malleshwaram', 'JP Nagar', 'Electronic City'] },
  { city: 'Hyderabad', state: 'Telangana', areas: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Secunderabad', 'Charminar', 'Kukatpally'] },
  { city: 'Chennai', state: 'Tamil Nadu', areas: ['Mylapore', 'T Nagar', 'Adyar', 'Anna Nagar', 'Velachery', 'Nungambakkam', 'Besant Nagar'] },
  { city: 'Kolkata', state: 'West Bengal', areas: ['Park Street', 'Salt Lake', 'Ballygunge', 'Howrah', 'New Town', 'Gariahat', 'Behala'] },
  { city: 'Pune', state: 'Maharashtra', areas: ['Koregaon Park', 'Kothrud', 'Viman Nagar', 'Hinjewadi', 'Aundh', 'Shivajinagar', 'Baner'] },
  { city: 'Ahmedabad', state: 'Gujarat', areas: ['Navrangpura', 'Satellite', 'Bodakdev', 'Maninagar', 'Vastrapur', 'Paldi', 'Prahlad Nagar'] },
  { city: 'Jaipur', state: 'Rajasthan', areas: ['C-Scheme', 'Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'Bani Park', 'Raja Park'] },
  { city: 'Lucknow', state: 'Uttar Pradesh', areas: ['Hazratganj', 'Gomti Nagar', 'Aliganj', 'Indira Nagar', 'Aminabad', 'Alambagh'] },
  { city: 'Chandigarh', state: 'Chandigarh', areas: ['Sector 17', 'Sector 22', 'Sector 35', 'Manimajra', 'Sector 43'] },
  { city: 'Kochi', state: 'Kerala', areas: ['Fort Kochi', 'Edappally', 'Marine Drive', 'Kakkanad', 'Panampilly Nagar'] },
  { city: 'Indore', state: 'Madhya Pradesh', areas: ['Vijay Nagar', 'Sarafa Bazaar', 'Palasia', 'Rajwada', 'Bhawarkua'] },
  { city: 'Bhopal', state: 'Madhya Pradesh', areas: ['New Market', 'Arera Colony', 'MP Nagar', 'Kolar Road', 'Bairagarh'] },
  { city: 'Nagpur', state: 'Maharashtra', areas: ['Dharampeth', 'Sitabuldi', 'Sadar', 'Manish Nagar', 'Civil Lines'] },
  { city: 'Surat', state: 'Gujarat', areas: ['Adajan', 'Vesu', 'Varachha', 'Piplod', 'City Light'] },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', areas: ['MVP Colony', 'Dwaraka Nagar', 'Gajuwaka', 'Madhurawada', 'Beach Road'] },
  { city: 'Patna', state: 'Bihar', areas: ['Boring Road', 'Kankarbagh', 'Patliputra', 'Rajendra Nagar', 'Danapur'] },
  { city: 'Guwahati', state: 'Assam', areas: ['Paltan Bazaar', 'Ganeshguri', 'Beltola', 'Six Mile', 'Uzan Bazar'] },
  { city: 'Bhubaneswar', state: 'Odisha', areas: ['Saheed Nagar', 'Patia', 'Nayapalli', 'Jaydev Vihar', 'Old Town'] },
  { city: 'Coimbatore', state: 'Tamil Nadu', areas: ['RS Puram', 'Gandhipuram', 'Peelamedu', 'Saibaba Colony', 'Race Course'] },
  { city: 'Thiruvananthapuram', state: 'Kerala', areas: ['Kowdiar', 'Vazhuthacaud', 'Pattom', 'Technopark', 'Kazhakkoottam'] },
  { city: 'Dehradun', state: 'Uttarakhand', areas: ['Rajpur Road', 'Clock Tower', 'Ballupur', 'Sahastradhara Road', 'Prem Nagar'] },
  { city: 'Mysuru', state: 'Karnataka', areas: ['Vijayanagar', 'Saraswathipuram', 'Kuvempunagar', 'Gokulam', 'Devaraja Mohalla'] },
  { city: 'Goa', state: 'Goa', areas: ['Panaji', 'Margao', 'Mapusa', 'Calangute', 'Vasco'] },
]

export const CITY_NAMES = INDIA.map((c) => c.city)

export const areasFor = (city = '') => {
  const hit = INDIA.find((c) => c.city.toLowerCase() === city.trim().toLowerCase())
  return hit ? hit.areas : []
}
