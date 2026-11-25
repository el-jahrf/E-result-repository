"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SchoolLogo from "@/components/SchoolLogo";

const sections = [
  { id: "home", label: "Home" },
  { id: "admissions", label: "Admissions" },
  { id: "about", label: "About Us" },
  { id: "academics", label: "Academics" },
  { id: "cbt", label: "JAMB CBT Centre" },
  { id: "why-choose-us", label: "Why Choose Us" },
  { id: "contact", label: "Contact" },
];

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState("home");
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLoginOpen, setMobileLoginOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio,
          );

        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        threshold: [0.2, 0.4, 0.6],
        rootMargin: "-15% 0px -35% 0px",
      },
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  function closeMenus() {
    setLoginOpen(false);
    setMobileOpen(false);
    setMobileLoginOpen(false);
  }

  return (
    <main className="rfa-site">

      {/* ANIMATED BACKGROUND */}

      <div className="ambient-background">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-glow" />
      </div>

      {/* NAVIGATION */}

      <header className="site-header">
        <nav className="glass-navigation">

          <Link
            href="#home"
            className="brand"
            onClick={closeMenus}
          >
            <SchoolLogo
              size={43}
              priority
              className="brand-logo"
            />

            <span className="brand-name">
              <strong>RISING FOUNDATION</strong>
              <small>ACADEMY</small>
            </span>
          </Link>

          <div className="desktop-navigation">
            {sections.map((section) => (
              <Link
                key={section.id}
                href={`#${section.id}`}
                className={
                  activeSection === section.id
                    ? "nav-link active"
                    : "nav-link"
                }
                onClick={closeMenus}
              >
                {section.label}
              </Link>
            ))}
          </div>

          {/* DESKTOP LOGIN */}

          <div className="login-container">

            <button
              className="login-trigger"
              onClick={() => setLoginOpen(!loginOpen)}
              aria-expanded={loginOpen}
            >
              Login
              <span className="login-arrow">
                {loginOpen ? "⌃" : "⌄"}
              </span>
            </button>

            {loginOpen && (
              <div className="login-dropdown">
                <div className="dropdown-heading">
                  <span>PORTAL ACCESS</span>
                  <strong>Welcome back</strong>
                </div>

                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="login-option"
                >
                  <span className="option-icon">🎓</span>
                  <span>
                    <strong>Student Login</strong>
                    <small>Access your academic portal</small>
                  </span>
                  <span className="option-arrow">→</span>
                </Link>

                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="login-option"
                >
                  <span className="option-icon">▣</span>
                  <span>
                    <strong>Staff Login</strong>
                    <small>Access your staff dashboard</small>
                  </span>
                  <span className="option-arrow">→</span>
                </Link>
              </div>
            )}
          </div>

          <button
            className="mobile-menu-button"
            onClick={() => {
              setMobileOpen(!mobileOpen);
              setMobileLoginOpen(false);
            }}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </nav>

        {/* MOBILE NAVIGATION */}

        {mobileOpen && (
          <div className="mobile-navigation glass-panel">

            {sections.map((section) => (
              <Link
                key={section.id}
                href={`#${section.id}`}
                onClick={closeMenus}
                className={
                  activeSection === section.id
                    ? "mobile-nav-link active"
                    : "mobile-nav-link"
                }
              >
                {section.label}
              </Link>
            ))}

            <button
              className="mobile-login"
              onClick={() => setMobileLoginOpen(!mobileLoginOpen)}
              aria-expanded={mobileLoginOpen}
            >
              Login to Portal
              <span>{mobileLoginOpen ? "⌃" : "⌄"}</span>
            </button>

            {/* COMPACT MOBILE LOGIN DROPDOWN */}

            {mobileLoginOpen && (
              <div className="mobile-login-dropdown">

                <div className="mobile-dropdown-heading">
                  <span>PORTAL ACCESS</span>
                  <strong>Choose your login</strong>
                </div>

                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="mobile-login-option"
                >
                  <span className="mobile-option-icon">🎓</span>
                  <span className="mobile-option-text">
                    <strong>Student Login</strong>
                    <small>Access your academic portal</small>
                  </span>
                  <span className="mobile-option-arrow">→</span>
                </Link>

                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="mobile-login-option"
                >
                  <span className="mobile-option-icon">▣</span>
                  <span className="mobile-option-text">
                    <strong>Staff Login</strong>
                    <small>Access your staff dashboard</small>
                  </span>
                  <span className="mobile-option-arrow">→</span>
                </Link>

              </div>
            )}

          </div>
        )}
      </header>

      {/* HOME / HERO */}

      <section id="home" className="hero-section">

        <div className="hero-content">

          <div className="hero-badge">
            <span className="badge-dot" />
            WELCOME TO RISING FOUNDATION ACADEMY
          </div>

          <h1>
            Building
            <span className="hero-highlight">
              {" "}Tomorrow's Leaders.
            </span>
          </h1>

          <p className="hero-description">
            At Rising Foundation Academy, we believe every child
            deserves the opportunity to learn, grow and achieve
            excellence. We are committed to nurturing knowledge,
            character and confidence for a brighter future.
          </p>

          <div className="hero-actions">

            <Link
              href="#admissions"
              className="primary-button"
            >
              Explore Admissions
              <span>→</span>
            </Link>

            <Link
              href="#about"
              className="secondary-button"
            >
              Discover Our School
            </Link>

          </div>

          <div className="hero-caption">
            <span className="caption-line" />
            ACADEMY FOR EXCELLENCE
          </div>

        </div>

        {/* FLOATING GLASS CARD */}

        <div className="hero-visual">

          <div className="floating-card main-glass-card">

            <div className="card-top">
              <span className="card-label">
                OUR COMMITMENT
              </span>
              <span className="card-indicator">✦</span>
            </div>

            <div className="card-symbol">✧</div>

            <h2>
              Excellence
              <br />
              Through Education.
            </h2>

            <p>
              Inspiring young minds to discover their
              potential and pursue their dreams.
            </p>

            <div className="card-bottom">
              <span>RISING FOUNDATION ACADEMY</span>
              <span>01 / 03</span>
            </div>

          </div>

          <div className="floating-note note-one">
            <span>✦</span>
            <div>
              <strong>Learning</strong>
              <small>For a better tomorrow</small>
            </div>
          </div>

          <div className="floating-note note-two">
            <span>◎</span>
            <div>
              <strong>Character</strong>
              <small>Building good values</small>
            </div>
          </div>

        </div>

        <a href="#admissions" className="scroll-indicator">
          <span>SCROLL TO EXPLORE</span>
          <span className="scroll-line" />
        </a>

      </section>

      {/* ADMISSIONS */}

      <section id="admissions" className="content-section">

        <div className="section-heading">

          <span className="section-eyebrow">
            YOUR JOURNEY STARTS HERE
          </span>

          <h2>
            Begin Your Journey
            <span> With Us.</span>
          </h2>

          <p>
            Give your child the opportunity to learn in an
            environment that encourages academic growth,
            personal development and excellence.
          </p>

        </div>

        <div className="admission-grid">

          <article className="glass-card admission-card">
            <span className="feature-number">01</span>
            <div className="feature-icon">✧</div>

            <h3>Discover</h3>

            <p>
              Learn about our school, educational approach
              and the opportunities available to our students.
            </p>
          </article>

          <article className="glass-card admission-card">
            <span className="feature-number">02</span>
            <div className="feature-icon">◇</div>

            <h3>Make Enquiries</h3>

            <p>
              Contact the school to obtain information
              about admission availability and requirements.
            </p>
          </article>

          <article className="glass-card admission-card">
            <span className="feature-number">03</span>
            <div className="feature-icon">✦</div>

            <h3>Join Our Community</h3>

            <p>
              Complete the school's admission process
              and begin an exciting educational journey.
            </p>
          </article>

        </div>

        <div className="admission-banner glass-panel">
          <div>
            <span className="section-eyebrow">
              ADMISSIONS ENQUIRIES
            </span>

            <h3>
              Every great journey begins with a step.
            </h3>

            <p>
              Get in touch with Rising Foundation Academy
              to learn more about joining our school.
            </p>
          </div>

          <Link href="#contact" className="primary-button">
            Contact the School →
          </Link>
        </div>

      </section>

      {/* ABOUT US */}

      <section id="about" className="content-section about-section">

        <div className="about-visual">

          <div className="about-glass-card">

            <span className="about-symbol">RFA</span>

            <div className="about-card-bottom">
              <span>KNOWLEDGE</span>
              <span>CHARACTER</span>
              <span>EXCELLENCE</span>
            </div>

          </div>

        </div>

        <div className="about-content">

          <span className="section-eyebrow">
            WHO WE ARE
          </span>

          <h2>
            More Than A School.
            <span> A Foundation For Life.</span>
          </h2>

          <p>
            Rising Foundation Academy is committed to
            providing an educational environment where
            students can develop their intellectual abilities,
            discover their talents and build the character
            needed to succeed in life.
          </p>

          <p>
            We believe education goes beyond the classroom.
            It is about nurturing responsible individuals,
            encouraging curiosity and preparing young people
            to contribute positively to society.
          </p>

          <p>
            Founded in 2015, Rising Foundation Academy has continued
            its commitment to supporting learners through the important
            stages of their educational journey. We aim to provide a
            strong foundation in knowledge, character and confidence
            that students can carry into the future.
          </p>

          <div className="founding-badge">
            <strong>2015</strong>
            <span>Established with a vision for learning and excellence</span>
          </div>

          <div className="values-grid">

            <div className="value-item">
              <span>✦</span>
              <strong>Our Mission</strong>
              <p>
                To nurture knowledgeable, confident and
                responsible learners.
              </p>
            </div>

            <div className="value-item">
              <span>◇</span>
              <strong>Our Vision</strong>
              <p>
                To inspire excellence and prepare students
                for a brighter future.
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* ACADEMICS */}

      <section id="academics" className="content-section">

        <div className="section-heading">

          <span className="section-eyebrow">
            OUR ACADEMIC STRUCTURE
          </span>

          <h2>
            A Journey Through
            <span> Every Stage.</span>
          </h2>

          <p>
            Our academic structure supports students
            throughout their educational development.
          </p>

        </div>

        <div className="academic-grid">

          {[
            {
              number: "01",
              title: "Nursery",
              description:
                "Supporting early childhood development through foundational learning, exploration, creativity and discovery.",
            },
            {
              number: "02",
              title: "Primary",
              description:
                "Strengthening literacy, numeracy, creativity and essential knowledge while building confidence and good learning habits.",
            },
            {
              number: "03",
              title: "Junior Secondary",
              description:
                "Building subject knowledge, independent learning skills and a strong foundation for senior secondary education.",
            },
            {
              number: "04",
              title: "Senior Secondary",
              description:
                "Developing deeper subject understanding and preparing students for further education, career pathways and external examinations.",
            },
          ].map((level) => (

            <article
              key={level.number}
              className="glass-card academic-card"
            >
              <span>{level.number}</span>

              <h3>{level.title}</h3>

              <p>{level.description}</p>

              <div className="academic-line" />
            </article>

          ))}

        </div>

        <div className="academic-note glass-panel">
          <div>
            <span className="section-eyebrow">LEARNING BEYOND THE CLASSROOM</span>
            <h3>Preparing students for the next step.</h3>
            <p>
              Our academic journey also includes ICT learning and preparation
              for external examinations such as WAEC and NECO.
            </p>
          </div>
          <div className="academic-note-tags">
            <span>ICT Education</span>
            <span>WAEC Preparation</span>
            <span>NECO Preparation</span>
          </div>
        </div>

      </section>

      {/* JAMB CBT CENTRE */}

      <section id="cbt" className="content-section cbt-section">
        <div className="cbt-panel glass-panel">
          <div className="cbt-content">
            <span className="section-eyebrow">COMPUTER-BASED TESTING</span>
            <h2>
              JAMB CBT Centre.
              <span> Supporting Every Candidate.</span>
            </h2>
            <p>
              Rising Foundation Academy provides a JAMB Computer-Based Test
              (CBT) centre that accommodates both internal and external
              candidates. Our centre is intended to provide candidates with
              access to a computer-based examination environment.
            </p>
            <p>
              Whether you are a student of the academy or a candidate from
              another school, you can contact us for enquiries about the
              centre and examination arrangements.
            </p>
            <a
              href="tel:08035904800"
              className="primary-button"
            >
              Enquire About the CBT Centre <span>→</span>
            </a>
          </div>

          <div className="cbt-visual" aria-hidden="true">
            <div className="cbt-screen">
              <div className="cbt-screen-top">
                <span />
                <span />
                <span />
              </div>
              <div className="cbt-screen-icon">⌨</div>
              <strong>JAMB CBT</strong>
              <small>INTERNAL &amp; EXTERNAL CANDIDATES</small>
              <div className="cbt-screen-line" />
            </div>
            <div className="cbt-floating-label">Computer-Based Testing</div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}

      <section id="why-choose-us" className="content-section why-section">
        <div className="section-heading">
          <span className="section-eyebrow">THE RFA EXPERIENCE</span>
          <h2>
            A Strong Foundation.
            <span> A Brighter Future.</span>
          </h2>
          <p>
            We believe that meaningful education develops the whole learner,
            combining academic growth with confidence, responsibility and
            positive values.
          </p>
        </div>

        <div className="why-grid">
          <article className="glass-card why-card">
            <span className="why-icon">✦</span>
            <h3>Academic Development</h3>
            <p>
              Learning experiences designed to build knowledge and support
              progress at every stage of education.
            </p>
          </article>
          <article className="glass-card why-card">
            <span className="why-icon">◇</span>
            <h3>Character and Values</h3>
            <p>
              Encouraging respect, responsibility, confidence and positive
              relationships as part of each learner's development.
            </p>
          </article>
          <article className="glass-card why-card">
            <span className="why-icon">◎</span>
            <h3>Examination Preparation</h3>
            <p>
              Supporting students as they prepare for important external
              examinations, including WAEC and NECO.
            </p>
          </article>
          <article className="glass-card why-card">
            <span className="why-icon">⌨</span>
            <h3>Technology and ICT</h3>
            <p>
              Promoting digital learning and computer skills, alongside access
              to our JAMB CBT centre for internal and external candidates.
            </p>
          </article>
        </div>
      </section>

      {/* CONTACT */}

      <section id="contact" className="content-section contact-section">

        <div className="contact-panel glass-panel">

          <div className="contact-content">

            <span className="section-eyebrow">
              WE WOULD LOVE TO HEAR FROM YOU
            </span>

            <h2>
              Let's Build A
              <span> Brighter Future.</span>
            </h2>

            <p>
              Have questions about our school, admissions
              or academic programmes? Reach out to us.
            </p>

            <div className="contact-details">

              <div>
                <span>⌖</span>
                <p>
                  Second Gate, Angwan Gwari, After Lado Mosque,
                  Suleja, Niger State, Nigeria.
                </p>
              </div>

              <div>
                <span>✉</span>
                <p>
                  <a href="mailto:risingfoundationacademy01@gmail.com">
                    risingfoundationacademy01@gmail.com
                  </a>
                </p>
              </div>

              <div>
                <span>☎</span>
                <p>
                  <a href="tel:08035904800">08035904800</a>
                  <br />
                  <a href="tel:07068516010">0706 851 6010</a>
                </p>
              </div>

            </div>

          </div>

          <div className="contact-decoration">
            <div className="contact-circle">
              RFA
            </div>

            <span>ACADEMY FOR EXCELLENCE</span>
          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="site-footer">

        <div className="footer-brand">
          <SchoolLogo size={45} />

          <div>
            <strong>RISING FOUNDATION ACADEMY</strong>
            <small>ACADEMY FOR EXCELLENCE</small>
          </div>
        </div>

        <p>
          Building knowledge. Inspiring excellence.
        </p>

        <div className="footer-contact">
          <a href="mailto:risingfoundationacademy01@gmail.com">
            risingfoundationacademy01@gmail.com
          </a>
          <a href="tel:08035904800">08035904800</a>
          <a href="tel:07068516010">0706 851 6010</a>
        </div>

        <div className="footer-social">
          <span>Connect with us</span>
          <a href="https://www.instagram.com/risingfoundationacademy/" target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href="https://www.facebook.com/risingfoundationacademy/" target="_blank" rel="noreferrer">
            Facebook
          </a>
          <a href="https://x.com/risingfoundationacademy" target="_blank" rel="noreferrer">
            X
          </a>
        </div>
        <p className="footer-handle">
          Social media username: @risingfoundationacademy
        </p>

        <div className="footer-bottom">
          © {new Date().getFullYear()} Rising Foundation Academy.
          All rights reserved.
        </div>

      </footer>

      {/* DESIGN STYLES */}

      <style jsx global>{`

        html {
          scroll-behavior: smooth;
          scroll-padding-top: 110px;
        }

        .rfa-site {
          --cream: #F7F1E7;
          --brown: #4A2C20;
          --secondary: #7A5038;
          --gold: #C8A878;

          position: relative;
          overflow: hidden;
          background: var(--cream);
          color: var(--brown);
          font-family: Arial, Helvetica, sans-serif;
        }

        .rfa-site * {
          box-sizing: border-box;
        }

        .ambient-background {
          position: absolute;
          inset: 0;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(
              ellipse at 20% 10%,
              rgba(200,168,120,.23),
              transparent 38%
            ),
            radial-gradient(
              ellipse at 85% 30%,
              rgba(74,44,32,.13),
              transparent 38%
            );
        }

        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(2px);
          animation: floatOrb 16s ease-in-out infinite alternate;
        }

        .orb-one {
          width: 420px;
          height: 420px;
          top: 100px;
          right: -150px;
          background: radial-gradient(
            circle,
            rgba(122,80,56,.35),
            rgba(122,80,56,.02) 70%
          );
        }

        .orb-two {
          width: 500px;
          height: 500px;
          top: 850px;
          left: -220px;
          background: radial-gradient(
            circle,
            rgba(200,168,120,.4),
            transparent 70%
          );
          animation-delay: -5s;
        }

        .orb-three {
          width: 400px;
          height: 400px;
          top: 2400px;
          right: -180px;
          background: radial-gradient(
            circle,
            rgba(74,44,32,.17),
            transparent 70%
          );
          animation-delay: -8s;
        }

        .ambient-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 30%,
            rgba(255,255,255,.22) 50%,
            transparent 70%
          );
          background-size: 200% 100%;
          animation: glowMove 18s linear infinite;
        }

        @keyframes floatOrb {
          from {
            transform: translate3d(0,0,0) scale(1);
          }
          to {
            transform: translate3d(-50px,70px,0) scale(1.15);
          }
        }

        @keyframes glowMove {
          from { background-position: 100% 0; }
          to { background-position: -100% 0; }
        }

        .site-header {
          position: fixed;
          z-index: 100;
          top: 20px;
          left: 0;
          width: 100%;
          padding: 0 20px;
        }

        .glass-navigation {
          position: relative;
          max-width: 1180px;
          margin: auto;
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 10px 15px 10px 20px;

          border: 1px solid rgba(255,255,255,.7);
          border-radius: 100px;

          background: rgba(255,250,242,.67);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);

          box-shadow:
            0 12px 40px rgba(74,44,32,.13),
            inset 0 1px 2px rgba(255,255,255,.9);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--brown);
        }

        .brand-logo {
          border-radius: 50% !important;
        }

        .brand-name {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .brand-name strong {
          font-size: 11px;
          letter-spacing: .06em;
          font-weight: 900;
        }

        .brand-name small {
          font-size: 9px;
          letter-spacing: .2em;
          color: var(--secondary);
        }

        .desktop-navigation {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .nav-link {
          position: relative;
          padding: 12px 13px;
          border-radius: 50px;
          color: var(--secondary);
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          transition: .3s;
        }

        .nav-link:hover,
        .nav-link.active {
          background: rgba(74,44,32,.1);
          color: var(--brown);
        }

        .login-container {
          position: relative;
        }

        .login-trigger {
          border: 0;
          padding: 13px 23px;
          border-radius: 50px;
          background: var(--brown);
          color: white;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          box-shadow: 0 5px 15px rgba(74,44,32,.2);
        }

        .login-arrow {
          margin-left: 9px;
        }

        .login-dropdown {
          position: absolute;
          right: 0;
          top: 65px;
          width: 290px;
          padding: 15px;
          border: 1px solid rgba(255,255,255,.8);
          border-radius: 24px;
          background: rgba(255,250,242,.9);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          box-shadow: 0 20px 60px rgba(74,44,32,.2);
          animation: dropdownIn .25s ease;
        }

        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-heading {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px 12px 16px;
        }

        .dropdown-heading span {
          font-size: 9px;
          letter-spacing: .16em;
          color: var(--secondary);
        }

        .dropdown-heading strong {
          font-size: 19px;
        }

        .login-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 10px;
          border-radius: 16px;
          color: var(--brown);
          text-decoration: none;
          transition: .2s;
        }

        .login-option:hover {
          background: rgba(200,168,120,.25);
        }

        .option-icon {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border-radius: 13px;
          background: rgba(200,168,120,.3);
        }

        .login-option div,
        .login-option > span:nth-child(2) {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .login-option strong {
          font-size: 12px;
        }

        .login-option small {
          font-size: 10px;
          color: var(--secondary);
        }

        .option-arrow {
          margin-left: auto;
        }

        .mobile-menu-button,
        .mobile-navigation {
          display: none;
        }

        .hero-section {
          position: relative;
          z-index: 1;
          min-height: 850px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1250px;
          margin: auto;
          padding: 160px 55px 130px;
          gap: 50px;
        }

        .hero-content {
          max-width: 610px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 17px;
          border: 1px solid rgba(200,168,120,.5);
          border-radius: 50px;
          background: rgba(255,255,255,.4);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .13em;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #9B8052;
          box-shadow: 0 0 10px rgba(200,168,120,.8);
        }

        .hero-content h1 {
          margin: 35px 0 22px;
          font-size: clamp(48px, 6vw, 83px);
          line-height: 1.02;
          letter-spacing: -.065em;
          font-weight: 900;
        }

        .hero-highlight {
          display: block;
          color: var(--secondary);
        }

        .hero-description {
          max-width: 530px;
          color: #766356;
          font-size: 15px;
          line-height: 1.9;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 13px;
          margin-top: 35px;
        }

        .primary-button,
        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          padding: 16px 23px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          transition: .3s;
        }

        .primary-button {
          background: var(--brown);
          color: white;
          box-shadow: 0 10px 25px rgba(74,44,32,.18);
        }

        .primary-button:hover {
          transform: translateY(-4px);
          background: var(--secondary);
        }

        .secondary-button {
          border: 1px solid rgba(74,44,32,.25);
          color: var(--brown);
          background: rgba(255,255,255,.35);
        }

        .secondary-button:hover {
          background: white;
          transform: translateY(-3px);
        }

        .hero-caption {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 65px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .2em;
          color: var(--secondary);
        }

        .caption-line {
          width: 40px;
          height: 1px;
          background: var(--gold);
        }

        .hero-visual {
          position: relative;
          width: 440px;
          height: 460px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
        }

        .main-glass-card {
          position: relative;
          width: 340px;
          min-height: 370px;
          padding: 30px;
          border: 1px solid rgba(255,255,255,.85);
          border-radius: 35px;
          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.78),
              rgba(200,168,120,.18)
            );
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          box-shadow:
            0 35px 80px rgba(74,44,32,.18),
            inset 0 2px 3px white;
          transform: rotate(-4deg);
          animation: cardFloat 7s ease-in-out infinite;
        }

        @keyframes cardFloat {
          0%,100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-18px) rotate(-1deg); }
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-label {
          font-size: 9px;
          letter-spacing: .16em;
          font-weight: 900;
          color: var(--secondary);
        }

        .card-indicator {
          font-size: 23px;
        }

        .card-symbol {
          margin-top: 45px;
          font-size: 65px;
          color: var(--secondary);
        }

        .main-glass-card h2 {
          font-size: 34px;
          line-height: 1.1;
          letter-spacing: -.04em;
        }

        .main-glass-card p {
          color: #766356;
          font-size: 12px;
          line-height: 1.8;
        }

        .card-bottom {
          display: flex;
          justify-content: space-between;
          margin-top: 35px;
          padding-top: 17px;
          border-top: 1px solid rgba(74,44,32,.15);
          font-size: 8px;
          letter-spacing: .1em;
          font-weight: 800;
        }

        .floating-note {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 20px;
          border: 1px solid rgba(255,255,255,.9);
          border-radius: 20px;
          background: rgba(255,255,255,.65);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          box-shadow: 0 15px 35px rgba(74,44,32,.12);
        }

        .floating-note > span {
          font-size: 25px;
          color: var(--secondary);
        }

        .floating-note div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .floating-note strong {
          font-size: 11px;
        }

        .floating-note small {
          font-size: 9px;
          color: var(--secondary);
        }

        .note-one {
          top: 50px;
          right: -5px;
        }

        .note-two {
          bottom: 45px;
          left: -15px;
        }

        .scroll-indicator {
          position: absolute;
          bottom: 35px;
          left: 55px;
          display: flex;
          align-items: center;
          gap: 15px;
          color: var(--secondary);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .17em;
          text-decoration: none;
        }

        .scroll-line {
          width: 45px;
          height: 1px;
          background: var(--gold);
        }

        .content-section {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: auto;
          padding: 120px 45px;
        }

        .section-heading {
          max-width: 670px;
          margin: 0 auto 60px;
          text-align: center;
        }

        .section-eyebrow {
          color: var(--secondary);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .2em;
        }

        .section-heading h2,
        .about-content h2,
        .contact-content h2 {
          margin: 20px 0;
          font-size: clamp(35px, 5vw, 55px);
          line-height: 1.1;
          letter-spacing: -.05em;
          font-weight: 900;
        }

        .section-heading h2 span,
        .about-content h2 span,
        .contact-content h2 span {
          color: var(--secondary);
        }

        .section-heading p,
        .about-content > p,
        .contact-content > p {
          color: #766356;
          font-size: 14px;
          line-height: 1.9;
        }

        .admission-grid,
        .academic-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }

        .glass-card {
          position: relative;
          border: 1px solid rgba(255,255,255,.9);
          border-radius: 28px;
          background: rgba(255,255,255,.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow:
            0 15px 45px rgba(74,44,32,.07),
            inset 0 1px 2px white;
          transition: .35s;
        }

        .glass-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 55px rgba(74,44,32,.13);
        }

        .admission-card {
          min-height: 290px;
          padding: 30px;
        }

        .feature-number {
          position: absolute;
          top: 25px;
          right: 28px;
          font-size: 12px;
          color: var(--secondary);
          font-weight: 900;
        }

        .feature-icon {
          display: grid;
          place-items: center;
          width: 65px;
          height: 65px;
          border-radius: 20px;
          background: rgba(200,168,120,.25);
          font-size: 30px;
        }

        .admission-card h3,
        .academic-card h3 {
          margin: 27px 0 12px;
          font-size: 22px;
        }

        .admission-card p,
        .academic-card p {
          color: #766356;
          font-size: 12px;
          line-height: 1.9;
        }

        .admission-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          margin-top: 35px;
          padding: 35px;
          border-radius: 28px;
        }

        .admission-banner h3 {
          margin: 12px 0;
          font-size: 24px;
        }

        .admission-banner p {
          color: #766356;
          font-size: 12px;
          line-height: 1.8;
        }

        .about-section {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          align-items: center;
          gap: 85px;
        }

        .about-visual {
          display: grid;
          place-items: center;
          min-height: 430px;
          border-radius: 35px;
          background:
            radial-gradient(
              circle at 30% 20%,
              rgba(200,168,120,.6),
              transparent 55%
            ),
            linear-gradient(
              145deg,
              #7A5038,
              #4A2C20
            );
          box-shadow: 0 30px 70px rgba(74,44,32,.2);
        }

        .about-glass-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 75%;
          height: 300px;
          padding: 30px;
          border: 1px solid rgba(255,255,255,.5);
          border-radius: 25px;
          background: rgba(255,255,255,.12);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          box-shadow: inset 0 1px 2px rgba(255,255,255,.4);
          transform: rotate(-5deg);
        }

        .about-symbol {
          color: white;
          font-size: 75px;
          font-weight: 900;
          letter-spacing: -.08em;
        }

        .about-card-bottom {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          color: white;
          font-size: 8px;
          letter-spacing: .1em;
        }

        .about-card-bottom span {
          padding: 8px;
          border: 1px solid rgba(255,255,255,.35);
          border-radius: 30px;
        }

        .about-content h2 {
          font-size: clamp(35px, 4vw, 48px);
        }

        .values-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 35px;
        }

        .value-item {
          padding: 20px;
          border-radius: 20px;
          background: rgba(255,255,255,.45);
          border: 1px solid rgba(255,255,255,.8);
        }

        .value-item > span {
          color: var(--secondary);
          font-size: 23px;
        }

        .value-item strong {
          display: block;
          margin: 12px 0 8px;
          font-size: 13px;
        }

        .value-item p {
          color: #766356;
          font-size: 11px;
          line-height: 1.8;
        }

        .academic-grid {
          grid-template-columns: repeat(4, 1fr);
        }

        .founding-badge {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          margin-top: 24px;
          padding: 13px 18px;
          border: 1px solid rgba(200,168,120,.55);
          border-radius: 18px;
          background: rgba(255,255,255,.48);
        }

        .founding-badge strong {
          color: var(--secondary);
          font-size: 27px;
          letter-spacing: -.05em;
        }

        .founding-badge span {
          max-width: 190px;
          color: #766356;
          font-size: 10px;
          line-height: 1.6;
        }

        .academic-note {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          margin-top: 28px;
          padding: 28px 32px;
          border-radius: 25px;
        }

        .academic-note h3 {
          margin: 10px 0;
          font-size: 23px;
        }

        .academic-note p {
          max-width: 570px;
          margin: 0;
          color: #766356;
          font-size: 12px;
          line-height: 1.8;
        }

        .academic-note-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          max-width: 330px;
        }

        .academic-note-tags span {
          padding: 9px 12px;
          border: 1px solid rgba(200,168,120,.55);
          border-radius: 30px;
          color: var(--secondary);
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .academic-card {
          min-height: 255px;
          padding: 28px;
        }

        .academic-card > span {
          color: var(--secondary);
          font-size: 11px;
          font-weight: 900;
        }

        .academic-card h3 {
          margin-top: 35px;
          font-size: 20px;
        }

        .academic-line {
          width: 45px;
          height: 3px;
          margin-top: 25px;
          border-radius: 10px;
          background: var(--gold);
        }
                  .cbt-section {
          padding-top: 70px;
        }

        .cbt-panel {
          display: grid;
          grid-template-columns: 1.15fr .85fr;
          align-items: center;
          gap: 45px;
          padding: 60px;
          border-radius: 35px;
          background:
            radial-gradient(circle at 85% 15%, rgba(200,168,120,.28), transparent 35%),
            rgba(255,255,255,.48);
        }

        .cbt-content h2 {
          margin: 20px 0;
          font-size: clamp(35px, 4.5vw, 52px);
          line-height: 1.1;
          letter-spacing: -.05em;
          font-weight: 900;
        }

        .cbt-content h2 span {
          color: var(--secondary);
        }

        .cbt-content p {
          color: #766356;
          font-size: 13px;
          line-height: 1.9;
        }

        .cbt-content .primary-button {
          margin-top: 18px;
        }

        .cbt-visual {
          position: relative;
          display: grid;
          place-items: center;
          min-height: 310px;
          border-radius: 28px;
          background: linear-gradient(145deg, #7A5038, #4A2C20);
          box-shadow: 0 25px 55px rgba(74,44,32,.2);
          overflow: hidden;
        }

        .cbt-visual::before,
        .cbt-visual::after {
          position: absolute;
          content: "";
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 50%;
        }

        .cbt-visual::before {
          width: 330px;
          height: 330px;
        }

        .cbt-visual::after {
          width: 250px;
          height: 250px;
        }

        .cbt-screen {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: min(78%, 280px);
          min-height: 205px;
          padding: 22px;
          border: 1px solid rgba(255,255,255,.65);
          border-radius: 22px;
          background: rgba(255,255,255,.16);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          color: white;
          box-shadow: 0 20px 45px rgba(0,0,0,.16), inset 0 1px 2px rgba(255,255,255,.35);
        }

        .cbt-screen-top {
          position: absolute;
          top: 14px;
          left: 16px;
          display: flex;
          gap: 5px;
        }

        .cbt-screen-top span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,.75);
        }

        .cbt-screen-icon {
          margin-top: 12px;
          font-size: 45px;
        }

        .cbt-screen strong {
          margin-top: 8px;
          font-size: 23px;
          letter-spacing: .08em;
        }

        .cbt-screen small {
          margin-top: 7px;
          font-size: 8px;
          letter-spacing: .12em;
          text-align: center;
        }

        .cbt-screen-line {
          width: 55px;
          height: 3px;
          margin-top: 17px;
          border-radius: 5px;
          background: var(--gold);
        }

        .cbt-floating-label {
          position: absolute;
          right: 12px;
          bottom: 28px;
          z-index: 2;
          padding: 11px 15px;
          border: 1px solid rgba(255,255,255,.7);
          border-radius: 30px;
          background: rgba(255,250,242,.82);
          color: var(--brown);
          font-size: 10px;
          font-weight: 800;
          box-shadow: 0 10px 25px rgba(0,0,0,.12);
        }

        .why-section {
          padding-top: 70px;
        }

        .why-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .why-card {
          min-height: 230px;
          padding: 27px;
        }

        .why-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 15px;
          background: rgba(200,168,120,.28);
          color: var(--secondary);
          font-size: 24px;
        }

        .why-card h3 {
          margin: 22px 0 10px;
          font-size: 17px;
        }

        .why-card p {
          color: #766356;
          font-size: 11px;
          line-height: 1.85;
        }

        .contact-section {
          padding-bottom: 100px;
        }

        .contact-panel {
          display: grid;
          grid-template-columns: 1.2fr .8fr;
          align-items: center;
          gap: 50px;
          padding: 65px;
          border-radius: 35px;
          background: rgba(255,255,255,.45);
        }

        .contact-content h2 {
          font-size: clamp(35px, 5vw, 55px);
        }

        .contact-details {
          margin-top: 30px;
        }

        .contact-details > div {
          display: flex;
          align-items: flex-start;
          gap: 15px;
        }

        .contact-details span {
          font-size: 25px;
          color: var(--secondary);
        }

        .contact-details p {
          max-width: 350px;
          font-size: 12px;
          line-height: 1.8;
          color: var(--secondary);
        }

        .contact-details a,
        .footer-contact a,
        .footer-social a {
          color: inherit;
          text-decoration: none;
          overflow-wrap: anywhere;
        }

        .contact-details a:hover,
        .footer-contact a:hover,
        .footer-social a:hover {
          text-decoration: underline;
        }

        .contact-decoration {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 25px;
        }

        .contact-circle {
          display: grid;
          place-items: center;
          width: 200px;
          height: 200px;
          border: 1px solid rgba(255,255,255,.7);
          border-radius: 50%;
          background: linear-gradient(
            145deg,
            rgba(200,168,120,.8),
            rgba(74,44,32,.95)
          );
          color: white;
          font-size: 50px;
          font-weight: 900;
          box-shadow:
            0 20px 50px rgba(74,44,32,.2),
            inset 0 2px 5px rgba(255,255,255,.4);
        }

        .contact-decoration > span {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .2em;
          color: var(--secondary);
        }

        .site-footer {
          position: relative;
          z-index: 1;
          padding: 50px 45px 25px;
          border-top: 1px solid rgba(74,44,32,.12);
          background: rgba(255,255,255,.3);
          text-align: center;
        }

        .footer-brand {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 13px;
          text-align: left;
        }

        .footer-brand > div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .footer-brand strong {
          font-size: 11px;
          letter-spacing: .08em;
        }

        .footer-brand small {
          font-size: 9px;
          letter-spacing: .15em;
          color: var(--secondary);
        }

        .site-footer > p {
          margin: 20px 0 20px;
          font-size: 12px;
          color: var(--secondary);
        }

        .footer-contact,
        .footer-social {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px 20px;
          margin: 15px auto;
          color: var(--secondary);
          font-size: 11px;
        }

        .footer-social span {
          font-weight: 800;
          color: var(--brown);
        }

        .footer-handle {
          margin: 10px 0 25px !important;
          font-size: 10px !important;
        }

        .footer-bottom {
          padding-top: 22px;
          border-top: 1px solid rgba(74,44,32,.1);
          color: var(--secondary);
          font-size: 10px;
        }

        @media (max-width: 1000px) {

          .desktop-navigation {
            gap: 0;
          }

          .nav-link {
            padding: 8px;
            font-size: 9px;
          }

          .brand-name strong {
            font-size: 9px;
          }

          .glass-navigation {
            gap: 10px;
          }

          .hero-section {
            padding-left: 35px;
            padding-right: 35px;
          }

          .hero-visual {
            transform: scale(.85);
            margin-left: -30px;
          }

          .about-section {
            gap: 40px;
          }

        }

        @media (max-width: 760px) {

          .site-header {
            top: 12px;
            padding: 0 12px;
          }

          .glass-navigation {
            min-height: 65px;
            padding: 8px 12px;
          }

          .brand-name strong {
            font-size: 9px;
          }

          .brand-name small {
            font-size: 8px;
          }

          .brand-logo {
            width: 37px !important;
            height: 37px !important;
          }

          .desktop-navigation,
          .login-container {
            display: none;
          }

          .mobile-menu-button {
            display: grid;
            place-items: center;
            width: 43px;
            height: 43px;
            border: 0;
            border-radius: 50%;
            background: var(--brown);
            color: white;
            font-size: 18px;
            cursor: pointer;
            flex-shrink: 0;
          }

          /* COMPACT MOBILE NAVIGATION PANEL */

          .mobile-navigation {
            display: flex;
            flex-direction: column;
            gap: 3px;
            width: min(100%, 360px);
            max-width: 360px;
            max-height: calc(100dvh - 105px);
            overflow-y: auto;
            overscroll-behavior: contain;
            margin: 10px 0 0 auto;
            padding: 12px;
            border: 1px solid rgba(255,255,255,.8);
            border-radius: 22px;
            background: rgba(255,250,242,.96);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            box-shadow: 0 20px 40px rgba(74,44,32,.15);
            animation: dropdownIn .25s ease;
          }

          .mobile-nav-link {
            display: block;
            padding: 11px 13px;
            border-radius: 13px;
            color: var(--brown);
            text-decoration: none;
            font-size: 12px;
            font-weight: 700;
            transition: background .2s;
          }

          .mobile-nav-link.active {
            background: rgba(200,168,120,.3);
          }

          .mobile-nav-link:hover {
            background: rgba(200,168,120,.2);
          }

          .mobile-login {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            margin-top: 6px;
            padding: 12px 14px;
            border: 0;
            border-radius: 13px;
            background: var(--brown);
            color: white;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }

          .mobile-login span {
            font-size: 15px;
          }

          /* SMALL MOBILE LOGIN DROPDOWN */

          .mobile-login-dropdown {
            width: 100%;
            margin-top: 7px;
            padding: 9px;
            border: 1px solid rgba(200,168,120,.45);
            border-radius: 17px;
            background: rgba(255,255,255,.72);
            box-shadow: 0 8px 22px rgba(74,44,32,.08);
            animation: dropdownIn .2s ease;
          }

          .mobile-dropdown-heading {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 5px 7px 9px;
          }

          .mobile-dropdown-heading span {
            color: var(--secondary);
            font-size: 8px;
            font-weight: 800;
            letter-spacing: .15em;
          }

          .mobile-dropdown-heading strong {
            color: var(--brown);
            font-size: 13px;
          }

          .mobile-login-option {
            display: flex;
            align-items: center;
            gap: 9px;
            width: 100%;
            padding: 9px 7px;
            border-radius: 12px;
            color: var(--brown);
            text-decoration: none;
            transition: background .2s;
          }

          .mobile-login-option:hover {
            background: rgba(200,168,120,.22);
          }

          .mobile-option-icon {
            display: grid;
            place-items: center;
            width: 33px;
            height: 33px;
            flex-shrink: 0;
            border-radius: 10px;
            background: rgba(200,168,120,.3);
            font-size: 15px;
          }

          .mobile-option-text {
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-width: 0;
          }

          .mobile-option-text strong {
            font-size: 11px;
          }

          .mobile-option-text small {
            color: var(--secondary);
            font-size: 9px;
          }

          .mobile-option-arrow {
            margin-left: auto;
            font-size: 13px;
          }

          .hero-section {
            min-height: auto;
            flex-direction: column;
            align-items: flex-start;
            padding: 145px 23px 110px;
            gap: 20px;
          }

          .hero-content {
            width: 100%;
          }

          .hero-badge {
            font-size: 8px;
          }

          .hero-content h1 {
            margin-top: 25px;
            font-size: clamp(45px, 12vw, 68px);
          }

          .hero-description {
            font-size: 13px;
          }

          .hero-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
          }

          .hero-caption {
            margin-top: 35px;
          }

          .hero-visual {
            width: 100%;
            max-width: 420px;
            height: 410px;
            margin: 0 auto;
            transform: scale(.85);
            transform-origin: center;
          }

          .main-glass-card {
            width: 300px;
            min-height: 340px;
          }

          .note-one {
            right: -5px;
          }

          .note-two {
            left: -5px;
          }

          .scroll-indicator {
            bottom: 25px;
            left: 23px;
          }

          .content-section {
            padding: 85px 22px;
          }

          .section-heading {
            margin-bottom: 40px;
          }

          .admission-grid,
          .academic-grid {
            grid-template-columns: 1fr;
          }

          .admission-card {
            min-height: 250px;
          }

          .admission-banner {
            flex-direction: column;
            align-items: flex-start;
            padding: 25px;
          }

          .about-section {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .about-visual {
            min-height: 330px;
          }

          .about-glass-card {
            height: 240px;
          }

          .about-symbol {
            font-size: 60px;
          }

          .values-grid {
            grid-template-columns: 1fr;
          }

          .academic-card {
            min-height: 210px;
          }

          .academic-note {
            flex-direction: column;
            align-items: flex-start;
            padding: 25px;
          }

          .academic-note-tags {
            justify-content: flex-start;
          }

          .cbt-panel {
            grid-template-columns: 1fr;
            padding: 30px 23px;
            gap: 30px;
          }

          .cbt-visual {
            min-height: 270px;
          }

          .why-grid {
            grid-template-columns: 1fr 1fr;
          }

          .contact-panel {
            grid-template-columns: 1fr;
            padding: 30px 23px;
            gap: 40px;
          }

          .contact-circle {
            width: 160px;
            height: 160px;
          }

          .site-footer {
            padding: 40px 20px 20px;
          }

        }

        @media (max-width: 430px) {
          .why-grid {
            grid-template-columns: 1fr;
          }

          .academic-note-tags span {
            white-space: normal;
          }

          .footer-contact,
          .footer-social {
            flex-direction: column;
            gap: 10px;
          }

          .mobile-navigation {
            width: min(100%, 340px);
            max-width: 340px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }

      `}</style>

    </main>
  );
}