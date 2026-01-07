import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const JoinUstartPage = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('join.title')}</h2>
                <p className="text-slate-600">
                    {t('join.description')}
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <Button onClick={() => alert("Redirect to onboarding flow")} className="bg-secondary-orange hover:bg-orange-600 text-white">
                        {t('join.completeButton')}
                    </Button>
                    <Button variant="outline" onClick={handleLogout}>
                        {t('join.logout')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
