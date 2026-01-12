import { useTranslation } from 'react-i18next';
import { Mail, MapPin, Instagram, Linkedin, Facebook } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { GooglePlayButton } from '@/components/ui/googlePlayButton';
import { AppStoreButton } from '@/components/ui/appStoreButton';

export const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="bg-[#0B1C33] text-slate-300 pt-20 pb-8 border-t border-slate-800">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-white">
                            <Logo color="#FFFFFF" />
                        </div>
                        <p className="text-sm leading-relaxed max-w-xs">
                            {t('landing.footer.brand.description')}
                        </p>
                        <div className="flex gap-3">
                            {[
                                { Icon: Instagram, href: 'https://www.instagram.com/ustart_rides/' },
                                { Icon: Linkedin, href: 'https://www.linkedin.com/company/ustartrg/' },
                                // { Icon: Twitter, href: '#' }, // Using Twitter icon for X as standard
                                { Icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61572376997840' }
                            ].map(({ Icon, href }, index) => (
                                <a
                                    key={index}
                                    href={href}
                                    className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-secondary-orange hover:text-white transition-colors"
                                >
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Address Column */}
                    <div className="space-y-6">
                        <h3 className="text-white font-bold text-lg">{t('landing.footer.address.title')}</h3>
                        <div className="bg-[#132845] rounded-3xl p-6 flex items-start gap-4">
                            <div className="mt-1">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <MapPin className="w-4 h-4" />
                                </div>
                            </div>
                            <a href="https://maps.app.goo.gl/jFQACLezaBRVYWY96" target='_blank'>
                                <div className="space-y-1 text-sm">
                                    <p>{t('landing.footer.address.line1')}</p>
                                    <p>{t('landing.footer.address.line2')}</p>
                                    <p>{t('landing.footer.address.line3')}</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Contact Column */}
                    <div className="space-y-6">
                        <h3 className="text-white font-bold text-lg">{t('landing.footer.contact.title')}</h3>
                        <div className="bg-[#132845] rounded-3xl p-6 flex items-start gap-4">
                            <div className="mt-1">
                                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-secondary-orange">
                                    <Mail className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    {t('landing.footer.contact.emailLabel')}
                                </p>
                                <a href={`mailto:${t('landing.footer.contact.emailValue')}`} className="text-white font-medium hover:text-secondary-orange transition-colors">
                                    {t('landing.footer.contact.emailValue')}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Links Column */}
                    <div className="space-y-6">
                        <h3 className="text-white font-bold text-lg relative inline-block">
                            {t('landing.footer.links.title')}
                            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-secondary-orange rounded-full"></span>
                        </h3>
                        <ul className="space-y-3 text-sm">
                            {[
                                t('landing.footer.links.support'),
                                t('landing.footer.links.privacy'),
                                t('landing.footer.links.terms'),
                                t('landing.footer.links.refund')
                            ].map((link, index) => (
                                <li key={index}>
                                    <a href="#" className="hover:text-secondary-orange transition-colors">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>

                        <div className="pt-4 space-y-4">
                            <h4 className="text-white font-bold text-sm">
                                {t('landing.footer.download.title')}
                            </h4>
                            <div className="flex flex-col md:flex-row gap-4">
                                <button>
                                    <GooglePlayButton />
                                </button>
                                <button>
                                    <AppStoreButton />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>© {new Date().getFullYear()} {t('landing.footer.copyright')}</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-slate-300 transition-colors">{t('landing.footer.legal.sitemap')}</a>
                        <a href="#" className="hover:text-slate-300 transition-colors">{t('landing.footer.legal.security')}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
