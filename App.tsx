
import React, { useState, useEffect } from 'react';
import { POSForm } from './components/POSForm';
import { AdminPage } from './components/admin/AdminPage';
import { Button } from './components/common/Button';
import { LoginPage } from './components/auth/LoginPage';
import { useLanguage } from './contexts/LanguageContext';
import { LanguageSwitcher } from './components/common/LanguageSwitcher';
import { User } from './types';
import { productService } from './services/productService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'pos' | 'admin'>('pos');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true); // For initial session check
  const { t } = useLanguage();
  
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('authToken');
      const storedUserString = localStorage.getItem('currentUser'); // Keep for quick UI, but validate with token

      if (token && storedUserString) {
        try {
          // Attempt to validate session with backend using token
          const userFromApi = await productService.fetchCurrentUser();
          if (userFromApi) {
            setCurrentUser(userFromApi); // Use fresh user data from API
            localStorage.setItem('currentUser', JSON.stringify(userFromApi)); // Update local storage
             if (userFromApi.role === 'employee') {
                setCurrentView('pos');
            }
          } else {
            // Token invalid or session expired
            handleLogout(); // Clear local storage and state
          }
        } catch (error) {
          console.error("Session validation error:", error);
          handleLogout(); // Clear local storage on error
        }
      } else if (storedUserString) {
        // Fallback if no token but user string exists (less secure, phase out)
        try {
            const storedUser = JSON.parse(storedUserString) as User;
            setCurrentUser(storedUser);
             if (storedUser.role === 'employee') {
                setCurrentView('pos');
            }
        } catch (e) {
            console.error("Failed to parse stored user:", e);
            handleLogout();
        }
      }
      setIsLoadingSession(false);
    };

    checkSession();
  }, []);


  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // authToken is already set by productService.authenticateUser
    // Only store minimal, non-sensitive user info for UI convenience
    localStorage.setItem('currentUser', JSON.stringify({ id: user.id, username: user.username, role: user.role }));
    if (user.role === 'employee') {
        setCurrentView('pos');
    } else if (user.role === 'admin') {
        setCurrentView('admin'); // Or default to admin if preferred
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken'); // Ensure token is cleared
    setCurrentView('pos'); 
  };

  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Checking session...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-indigo-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold">
            {currentView === 'pos' ? t('app.titlePOS') : (currentUser.role === 'admin' ? t('app.titleAdmin') : t('app.titlePOS'))}
          </h1>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <LanguageSwitcher />
            <Button
              onClick={() => setCurrentView('pos')}
              variant={currentView === 'pos' ? 'primary' : 'ghost'}
              size="sm"
              className={`ml-2 ${currentView === 'pos' ? 'bg-indigo-500' : 'hover:bg-indigo-600 text-indigo-100'}`}
            >
              {t('app.navPOS')}
            </Button>
            {currentUser.role === 'admin' && (
              <Button
                onClick={() => setCurrentView('admin')}
                variant={currentView === 'admin' ? 'primary' : 'ghost'}
                size="sm"
                className={`${currentView === 'admin' ? 'bg-indigo-500' : 'hover:bg-indigo-600 text-indigo-100'}`}
              >
                {t('app.navAdmin')}
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="danger"
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {t('app.navLogout')}
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-2 sm:p-4 mt-4">
        <main>
          {currentView === 'pos' && <POSForm />}
          {currentView === 'admin' && currentUser.role === 'admin' && <AdminPage currentUser={currentUser} />}
          {currentView === 'admin' && currentUser.role === 'employee' && (
            <div className="text-center p-10 bg-white rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-red-600 mb-4">{t('errors.unauthorizedAccessTitle')}</h2>
              <p className="text-gray-700">{t('errors.unauthorizedAccessMessage')}</p>
              <Button onClick={() => setCurrentView('pos')} variant="primary" className="mt-6">
                {t('common.backToPOS')}
              </Button>
            </div>
          )}
        </main>
      </div>

      <footer className="text-center mt-12 py-6 border-t border-gray-300 bg-white">
        <p className="text-sm text-gray-600">{t('app.footer', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
};

export default App;
