import React from 'react';
import { Link } from 'react-router-dom';

// 인라인 스타일 정의
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '60px'
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#333'
  },
  subtitle: {
    fontSize: '18px',
    color: '#666'
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '60px'
  },
  section: {
    marginBottom: '40px'
  },
  sectionTitle: {
    fontSize: '24px',
    marginBottom: '24px',
    textAlign: 'center',
    color: '#333'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px'
  },
  card: {
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    backgroundColor: 'white',
    transition: 'transform 0.2s ease',
    cursor: 'pointer'
  },
  cardTitle: {
    fontSize: '20px',
    marginBottom: '12px',
    color: '#333'
  },
  cardText: {
    color: '#666'
  },
  cta: {
    textAlign: 'center',
    padding: '40px 0'
  },
  buttonContainer: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center'
  },
  button: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease'
  },
  buttonBlue: {
    backgroundColor: '#3b82f6'
  }
};

const HomePage = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Wardrobe Configurator</h1>
        <p style={styles.subtitle}>Design your perfect wardrobe with our 3D configurator</p>
      </header>
      
      <main style={styles.main}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Features</h2>
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>3D Design</h3>
              <p style={styles.cardText}>Design your wardrobe in real-time 3D</p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Custom Sizes</h3>
              <p style={styles.cardText}>Customize dimensions to fit your space</p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Save & Share</h3>
              <p style={styles.cardText}>Save your designs and share with others</p>
            </div>
          </div>
        </section>

        <section style={styles.cta}>
          <div style={styles.buttonContainer}>
            <Link to="/configurator" style={styles.button}>
              Start Designing
            </Link>
            <Link to="/wardrobe-editor" style={{...styles.button, ...styles.buttonBlue}}>
              New UI Editor
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage; 