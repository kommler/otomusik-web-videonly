// Test des statuts disponibles de l'API playlists
const API_BASE = 'http://localhost:8001';

async function testPlaylistsAPI() {
  try {
    console.log('Testing playlists API...');
    
    // Test l'endpoint count pour voir les statuts
    const countResponse = await fetch(`${API_BASE}/api/video/playlists/count`);
    if (countResponse.ok) {
      const countData = await countResponse.json();
      console.log('Count response:', countData);
      
      // Extraire les statuts (tout sauf 'count')
      const statuses = Object.keys(countData).filter(key => key !== 'count');
      console.log('Available statuses:', statuses);
      
      // Afficher les comptages par statut
      statuses.forEach(status => {
        console.log(`  - ${status}: ${countData[status]} playlists`);
      });
    } else {
      console.error('Count request failed:', countResponse.status);
    }
    
    // Test l'endpoint list pour voir quelques exemples
    const listResponse = await fetch(`${API_BASE}/api/video/playlists/?limit=5`);
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log(`\nFound ${listData.length} playlists (sample):`);
      listData.forEach((playlist, index) => {
        console.log(`  ${index + 1}. ${playlist.name || 'Unnamed'} - Status: ${playlist.status || 'No status'}`);
      });
      
      // Extraire les statuts uniques des données
      const uniqueStatuses = [...new Set(listData.map(p => p.status).filter(s => s))];
      console.log('\nUnique statuses in sample data:', uniqueStatuses);
    } else {
      console.error('List request failed:', listResponse.status);
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testPlaylistsAPI();