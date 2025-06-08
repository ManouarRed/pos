
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Omit<User, 'id' | 'hashedPassword'> | (Partial<Pick<User, 'username' | 'password' | 'role'>> & {id: string})) => void;
  user: User | null; // User to edit, or null for new user
  currentUser: User; // Currently logged-in admin
}

type FormData = {
  username: string;
  password?: string; // Optional for edit
  confirmPassword?: string; // Only for new user or password change
  role: UserRole;
};

const initialFormData: FormData = {
  username: '',
  password: '',
  confirmPassword: '',
  role: 'employee',
};

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, user, currentUser }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          username: user.username,
          password: '', // Keep password blank for edit unless changing
          confirmPassword: '',
          role: user.role,
        });
      } else {
        setFormData(initialFormData);
      }
      setFormErrors({});
    }
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof FormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.username.trim()) errors.username = t('userManagement.saveError', { error: 'Username is required.' });
    
    if (!user || formData.password) { // Password is required for new user or if explicitly changing
      if (!formData.password || formData.password.length < 6) {
        errors.password = t('userManagement.errorPasswordTooShort');
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = t('userManagement.saveError', { error: 'Passwords do not match.' });
      }
    }
    if (user && user.id === currentUser.id && formData.role === 'employee') {
        // Logic to check if this is the only admin would typically be in the service
        // For now, we'll rely on the service to throw an error which will be caught.
        // A more proactive check could be added here if we had access to all users.
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (user) { // Editing existing user
        const updatePayload: Partial<Pick<User, 'username' | 'password' | 'role'>> & {id: string} = {
            id: user.id,
            username: formData.username,
            role: formData.role,
        };
        if (formData.password) {
            updatePayload.password = formData.password;
        }
        onSave(updatePayload);
      } else { // Adding new user
        onSave({ 
            username: formData.username, 
            password: formData.password!, // Password is required for new users
            role: formData.role 
        });
      }
    }
  };

  if (!isOpen) return null;

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'employee', label: t('userManagement.roleEmployee') },
    { value: 'admin', label: t('userManagement.roleAdmin') },
  ];

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 id="user-modal-title" className="text-xl font-semibold text-gray-800">
            {user ? t('userManagement.modalEditTitle') : t('userManagement.modalAddTitle')}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={t('common.cancel')}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('userManagement.usernameLabel')}
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={formErrors.username}
            required
            autoFocus
          />
          <Input
            label={user ? t('userManagement.passwordOptional') : t('userManagement.passwordLabel')}
            id="password"
            name="password"
            type="password"
            value={formData.password || ''}
            onChange={handleChange}
            placeholder={t('userManagement.passwordPlaceholder')}
            error={formErrors.password}
            required={!user} 
          />
          {(!user || formData.password) && (
            <Input
              label={t('userManagement.confirmPasswordLabel')}
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword || ''}
              onChange={handleChange}
              placeholder={t('userManagement.confirmPasswordPlaceholder')}
              error={formErrors.confirmPassword}
              required={!user || !!formData.password}
            />
          )}
          <Select
            label={t('userManagement.roleLabel')}
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={roleOptions}
            error={formErrors.role as string | undefined}
            required
            // Disable changing own role to employee if current user is the one being edited
            // More robust check for "only admin" should be in service
            disabled={user?.id === currentUser.id && formData.role === 'admin'}
          />
           {user?.id === currentUser.id && formData.role === 'admin' && (
            <p className="text-xs text-gray-500">{t('userManagement.errorSelfDemote')}</p>
          )}

          <div className="pt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {user ? t('common.saveChanges') : t('common.add') + ' ' + t('userManagement.title')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
