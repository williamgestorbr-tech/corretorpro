import React, { useEffect, useState } from 'react';
import './LandingPage.css';

interface LandingPageProps {
    onStart: () => void;
    onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
    const [currentImage, setCurrentImage] = useState(0);
    const carouselImages = [
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % carouselImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => {
            observer.observe(el);
        });

        // Smooth scroll
        const handleScrollLink = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const href = target.getAttribute('href');
            if (href?.startsWith('#')) {
                e.preventDefault();
                document.querySelector(href)?.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        };

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', handleScrollLink as any);
        });

        return () => {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.removeEventListener('click', handleScrollLink as any);
            });
        };
    }, []);

    return (
        <div className="lp-body">


            <header className="lp-header">
                <div className="hero-content reveal">
                    <span className="hero-tag">Inteligência Artificial para Imóveis</span>
                    <h1>Anúncios que <span className="highlight">Vendem</span><br />Gerados em Segundos</h1>
                    <p className="hero-p">Adicione sua logo em todas as fotos automaticamente, exporte em <span className="highlight" style={{ fontWeight: 800 }}>4K</span> e gere descrições irresistíveis para todas as plataformas em segundos com a nossa IA especializada.</p>
                    <button onClick={onStart} className="cta-button">
                        COMEÇAR AGORA POR R$ 49,90 <i className="fa-solid fa-arrow-right"></i>
                    </button>
                    <div style={{ marginTop: '20px' }}>
                        <button onClick={onLogin} className="secondary-button">
                            <i className="fa-solid fa-right-to-bracket"></i> ACESSAR SISTEMA
                        </button>
                    </div>
                </div>
            </header>

            <section className="lp-section pain-section">
                <div className="pain-container reveal">
                    <div className="pain-header">
                        <span className="hero-tag tag-danger">O Problema</span>
                        <h2 className="pain-title">O mercado corre rápido.<br />Você está ficando <span className="highlight">para trás?</span></h2>
                        <p className="pain-description">O corretor moderno não tem tempo para ser redator. Ficar horas na frente do computador tentando criar o "anúncio perfeito" tira você do que realmente importa: <strong>fechar negócios.</strong></p>
                    </div>

                    <div className="pain-content">
                        <div className="pain-carousel-wrapper">
                            <div className="carousel-main">
                                {carouselImages.map((img, index) => (
                                    <img
                                        key={index}
                                        src={img}
                                        alt={`Imóvel ${index + 1}`}
                                        className={`pain-image carousel-img ${index === currentImage ? 'active' : ''}`}
                                    />
                                ))}
                                <div className="image-accent"></div>
                            </div>
                            <div className="carousel-dots">
                                {carouselImages.map((_, index) => (
                                    <span
                                        key={index}
                                        className={`dot ${index === currentImage ? 'active' : ''}`}
                                        onClick={() => setCurrentImage(index)}
                                    ></span>
                                ))}
                            </div>
                        </div>

                        <div className="pain-items-container">
                            <div className="pain-item">
                                <div className="pain-icon-wrapper"><i className="fa-solid fa-clock-rotate-left"></i></div>
                                <div>
                                    <h4>Perda de Tempo</h4>
                                    <p>Escrever para cada rede social manualmente consome horas do seu dia.</p>
                                </div>
                            </div>
                            <div className="pain-item">
                                <div className="pain-icon-wrapper"><i className="fa-solid fa-brain"></i></div>
                                <div>
                                    <h4>Bloqueio Criativo</h4>
                                    <p>A dificuldade de criar textos persuasivos que realmente atraem leads qualificados.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="lp-section" style={{ background: 'var(--glass)', borderRadius: '60px', marginTop: '40px' }}>
                <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                    <span className="hero-tag">Oferta Principal</span>
                    <h2 className="pain-title">Tudo o que você precisa para <span className="highlight">Dominar o Mercado</span></h2>
                    <p style={{ color: 'var(--text-muted)' }}>Tecnologia de ponta para corretores que não aceitam menos que a perfeição:</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card reveal">
                        <div className="feature-icon"><i className="fa-solid fa-stamp"></i></div>
                        <h3 style={{ marginBottom: '15px' }}>Logo em Todas as Fotos</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Aplique sua identidade visual em todas as fotos do imóvel instantaneamente, protegendo suas imagens e reforçando sua marca.</p>
                    </div>
                    <div className="feature-card reveal" style={{ transitionDelay: '0.1s' }}>
                        <div className="feature-icon"><i className="fa-solid fa-expand"></i></div>
                        <h3 style={{ marginBottom: '15px' }}>Exportação em 4K</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Qualidade cinematográfica para seus anúncios. Exporte fotos e vídeos com a maior resolução disponível no mercado.</p>
                    </div>
                    <div className="feature-card reveal" style={{ transitionDelay: '0.2s' }}>
                        <div className="feature-icon"><i className="fa-solid fa-pen-nib"></i></div>
                        <h3 style={{ marginBottom: '15px' }}>Descrições Imbatíveis</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Nossa IA gera copies persuasivas focadas em conversão para portais, Instagram, WhatsApp e TikTok.</p>
                    </div>
                </div>
            </section>

            <section className="lp-section preview-section">
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <span className="hero-tag">Tecnologia na Prática</span>
                    <h2 className="pain-title">Sinta o poder de<br />trabalhar com <span className="highlight">Inteligência</span></h2>
                </div>

                <div className="preview-container">
                    {/* Watermark Preview */}
                    <div className="preview-row reveal">
                        <div className="preview-text">
                            <div className="preview-badge"><i className="fa-solid fa-stamp"></i> Watermark Profissional</div>
                            <h3>Sua marca em cada detalhe</h3>
                            <p>Proteja seus imóveis e fortaleça sua identidade visual. Com um clique, nossa plataforma aplica sua logo em todas as fotos da galeria com transparência perfeita e exportação em 4K.</p>
                            <ul className="preview-features">
                                <li><i className="fa-solid fa-bolt"></i> Processamento Instantâneo</li>
                                <li><i className="fa-solid fa-expand"></i> Qualidade 4K Ultra HD</li>
                                <li><i className="fa-solid fa-shield-halved"></i> Proteção Anti-Cópia</li>
                            </ul>
                        </div>
                        <div className="preview-image-box">
                            <div className="image-frame glass">
                                <img src="/previews/logo_watermark.png" alt="Sistema de Watermark" className="preview-img-actual" />
                                <div className="glow-accent"></div>
                            </div>
                        </div>
                    </div>

                    {/* AI Descriptions Preview */}
                    <div className="preview-row reveal reverse">
                        <div className="preview-text">
                            <div className="preview-badge"><i className="fa-solid fa-wand-magic-sparkles"></i> AI Generator</div>
                            <h3>Copies que convertem leads</h3>
                            <p>Não perca mais tempo pensando no que escrever. Nossa IA cria automaticamente legendas para Instagram, roteiros para TikTok, mensagens para WhatsApp e anúncios para portais.</p>
                            <ul className="preview-features">
                                <li><i className="fa-solid fa-brain"></i> IA Treinada para Imóveis</li>
                                <li><i className="fa-solid fa-hashtag"></i> Hashtags Estratégicas</li>
                                <li><i className="fa-solid fa-check-double"></i> Multi-Plataforma</li>
                            </ul>
                        </div>
                        <div className="preview-image-box">
                            <div className="image-frame glass">
                                <img src="/previews/ai_descriptions.png" alt="Sistema de Descrições AI" className="preview-img-actual" />
                                <div className="glow-accent"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="lp-section pricing-section" id="precos">
                <span className="hero-tag">Investimento</span>
                <h2 className="pain-title">Assine o <span className="highlight">Plano Mensal</span></h2>
                <p style={{ color: 'var(--text-muted)' }}>Menos que o valor de um café por dia para transformar sua produtividade.</p>

                <div className="price-card reveal">
                    <p style={{ fontWeight: 800, color: 'var(--primary)' }}>PRO MENSAL</p>
                    <div className="price-value">R$ 49,90<span className="price-period">/mês</span></div>

                    <ul className="check-list">
                        <li><i className="fa-solid fa-check"></i> Gerador de Anúncios Ilimitado</li>
                        <li><i className="fa-solid fa-check"></i> Copies para 4 Plataformas</li>
                        <li><i className="fa-solid fa-check"></i> Inteligência Artificial Premium</li>
                        <li><i className="fa-solid fa-check"></i> Watermark Profissional</li>
                        <li><i className="fa-solid fa-check"></i> Histórico de Descrições</li>
                        <li><i className="fa-solid fa-check"></i> Suporte Prioritário</li>
                    </ul>

                    <button onClick={onStart} className="cta-button" style={{ width: '100%', justifyContent: 'center' }}>
                        QUERO SER UM CORRETOR PRO
                    </button>
                    <button onClick={onLogin} className="secondary-button" style={{ width: '100%', justifyContent: 'center', marginTop: '15px' }}>
                        <i className="fa-solid fa-right-to-bracket"></i> JÁ SOU ASSINANTE (ENTRAR)
                    </button>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px' }}>Pagamento seguro via Cakto • Cancelamento a qualquer momento</p>
                </div>
            </section>

            <footer className="lp-footer">
                <span className="footer-logo">Corretor <span className="highlight">Pro</span></span>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>&copy; 2026 Corretor Pro. Todos os direitos reservados.</p>
                <div style={{ marginTop: '20px', fontSize: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <i className="fa-brands fa-instagram"></i>
                    <i className="fa-brands fa-facebook"></i>
                    <i className="fa-brands fa-whatsapp"></i>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
