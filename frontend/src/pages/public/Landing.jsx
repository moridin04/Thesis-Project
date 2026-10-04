import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarClock,
  Droplets,
  GitCompare,
  GraduationCap,
  LayoutDashboard,
  Map,
  MapPinned,
  Users,
  ArrowUpRight,
  Mail,
} from 'lucide-react'
import SourceLink from '../../components/shared/SourceLink'
import PublicHeader from '../../components/public/PublicHeader'
import PublicFooter from '../../components/public/PublicFooter'
import HeroCarousel from '../../components/public/HeroCarousel'
import FloodMosaic from '../../components/public/FloodMosaic'
import { initScrollFade } from '../../utils/scrollFade'
import { initCountUp } from '../../utils/countUp'
import { BRAND } from '../../auth/config'
import { floodMosaicImages, heroCarouselImages } from '../../data/landingImagery'
import {
  avatarColors,
  feedbackLinks,
  getInitials,
  teamMembers,
} from '../../data/landingTeam'

const features = [
  {
    number: '01',
    title: 'Explore the Priority Map',
    body: 'View the geographic distribution of published flood-risk classifications across Manila’s barangays.',
    to: '/priority-map',
    linkLabel: 'Explore Priority Map',
    icon: Map,
  },
  {
    number: '02',
    title: 'Review the Overview',
    body: 'See citywide summaries of published risk classifications, indicator trends, and barangay counts per risk level.',
    to: '/overview',
    linkLabel: 'View Overview',
    icon: LayoutDashboard,
  },
  {
    number: '03',
    title: 'View Barangay Profiles',
    body: 'Review a barangay’s published risk level, indicators, contributing factors, and planning recommendations.',
    to: '/rankings',
    linkLabel: 'View Rankings',
    icon: MapPinned,
  },
  {
    number: '04',
    title: 'Compare Barangays',
    body: 'Compare the risk characteristics and indicators of selected barangays side by side.',
    to: '/compare',
    linkLabel: 'Compare Barangays',
    icon: GitCompare,
  },
  {
    number: '05',
    title: 'Understand the Methodology',
    body: 'Learn about the data sources, selected indicators, analytical process, model evaluation, and system limitations.',
    to: '/methodology',
    linkLabel: 'Read Methodology',
    icon: BookOpen,
  },
]

const audiences = [
  {
    number: '01',
    title: 'Residents and Communities',
    body: 'For exploring published flood-risk information about barangays in the City of Manila.',
    icon: Users,
    accentClass: 'card-accent-1',
  },
  {
    number: '02',
    title: 'Barangay and LGU Stakeholders',
    body: 'For supporting initial prioritization, preparedness discussions, and data-informed planning.',
    icon: Building2,
    accentClass: 'card-accent-2',
  },
  {
    number: '03',
    title: 'Students and Researchers',
    body: 'For examining barangay-level risk indicators, spatial patterns, methodology, and system limitations.',
    icon: GraduationCap,
    accentClass: 'card-accent-3',
  },
]

function TeamMemberCard({ member, colorIndex }) {
  const initials = getInitials(member.name)
  const avatarColor = avatarColors[colorIndex % avatarColors.length]

  return (
    <article className="team-member">
      <div
        className="team-member__avatar"
        style={{ backgroundColor: avatarColor }}
        aria-hidden="true"
      >
        {initials}
      </div>
      <p className="team-member__name">{member.name}</p>
      <a
        href={`mailto:${member.email}`}
        className="team-member__email"
        aria-label={`Email ${member.name}`}
      >
        <Mail className="h-4 w-4" aria-hidden />
      </a>
    </article>
  )
}

export default function Landing() {
  useEffect(() => {
    initScrollFade()
    initCountUp()
  }, [])

  useEffect(() => {
    function scrollToHash() {
      const { hash } = window.location
      if (!hash) return
      const target = document.querySelector(hash)
      if (!target) return
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    }

    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [])

  return (
    <div className="page-shell-landing page-clip-x relative flex min-h-screen flex-col">
      <PublicHeader />

      <HeroCarousel images={heroCarouselImages}>
        <p className="hero-carousel__eyebrow">City of Manila</p>
        <h1
          id="landing-hero-heading"
          className="hero-carousel__title public-page-heading font-display"
        >
          AGOS Manila
        </h1>
        <p className="hero-carousel__lead">
          AGOS is a barangay-level flood risk mapping and disaster prioritization
          platform. It uses spatial analytics and barangay-level indicators to
          visualize, classify, and prioritize flood risk, supporting
          disaster-preparedness planning at the community level.
        </p>

        <div className="hero-carousel__actions">
          <Link to="/priority-map" className="btn-primary hero-carousel__btn">
            Explore Priority Map
            <Map className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link to="/overview" className="btn-secondary hero-carousel__btn hero-carousel__btn-secondary">
            View Overview
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="hero-carousel__disclaimer">
          <AlertTriangle className="hero-carousel__disclaimer-icon" aria-hidden />
          <p>{BRAND.disclaimer}</p>
        </div>
      </HeroCarousel>

      {/* Flood impact mosaic + Why AGOS Matters */}
      <section
        className="flood-story landing-section fade-in-section section-white relative z-10"
        aria-labelledby="flood-story-heading"
      >
        <div className="landing-section-inner">
          <header className="flood-story__header">
            <span className="flood-story__eyebrow">Why AGOS Matters</span>
            <h2 id="flood-story-heading" className="flood-story__title">
              The Everyday Cost of Flooding
            </h2>
            <p className="flood-story__subtext">
              Every monsoon season, thousands of commuters, vendors, and families
              navigate flooded streets just to get through their day. Flooding
              isn&apos;t rare in Metro Manila — it&apos;s routine.
            </p>
          </header>

          <div className="flood-story__body">
            <div className="flood-story__mosaic">
              <FloodMosaic images={floodMosaicImages} />
              <p className="flood-story__photo-credit">
                Photos by{' '}
                <a
                  href="https://unsplash.com/@tearcordez"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tear Cordez
                </a>
                {' '}and{' '}
                <a
                  href="https://unsplash.com/@carlkho"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Carl Kho
                </a>
                {' '}on{' '}
                <a
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Unsplash
                </a>
              </p>
            </div>

            <div className="flood-story__context">
              <div className="flood-story__copy">
                <p className="flood-story__intro">
                  Livelihoods, transport, and daily routines are disrupted again and
                  again — often with little warning and even less coordinated response.
                  AGOS exists to change that: giving residents and responders clear,
                  data-driven visibility into flood risk before it becomes a crisis.
                </p>
                <Link to="/methodology" className="flood-story__cta">
                  Learn how AGOS prioritizes flood risk
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <div className="flood-story__stats">
                <article className="flood-story__stat-card">
                  <Droplets className="flood-story__stat-icon" aria-hidden />
                  <p className="flood-story__stat-label">
                    ~44 km² (about 7%) of Metro Manila is flood-prone under normal
                    conditions. During extreme events such as Typhoon Ondoy (2009),
                    flooding covered over 30% of the region, affecting more than
                    4 million people.
                  </p>
                  <ul className="flood-story__sources">
                    <li>
                      <SourceLink href="https://www.herdin.ph">Source: HERDIN, DOH</SourceLink>
                    </li>
                    <li>
                      <SourceLink href="https://doi.org/10.11520/JSHWR.24.0.8.0">
                        Source: Gilbuena (2011), Journal of Structural and Hydraulic Water
                        Resources, DOI: 10.11520/JSHWR.24.0.8.0
                      </SourceLink>
                    </li>
                  </ul>
                </article>
                <article className="flood-story__stat-card">
                  <CalendarClock className="flood-story__stat-icon" aria-hidden />
                  <p className="flood-story__stat-label">
                    The Philippines experiences an average of 19–20 tropical cyclones
                    annually (PAGASA).
                  </p>
                  <ul className="flood-story__sources">
                    <li>
                      <SourceLink href="https://www.pagasa.dost.gov.ph">Source: PAGASA</SourceLink>
                    </li>
                  </ul>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you can do */}
      <section
        id="explore"
        aria-labelledby="what-you-can-do-heading"
        className="fade-in-section section-tint landing-section relative z-10 border-t border-[color:var(--border-subtle)]"
      >
        <div className="landing-section-inner">
          <h2
            id="what-you-can-do-heading"
            className="landing-section-heading public-page-heading"
          >
            What You Can Do with AGOS
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-body">
            Explore interactive maps, barangay profiles, rankings, comparisons,
            and methodology — tools built from published flood-risk data you can
            actually use, from citywide views to barangay-level detail.
          </p>

          <div className="action-row-list">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Link
                  key={feature.title}
                  to={feature.to}
                  className="action-row"
                >
                  <p className="action-row__number">{feature.number}</p>
                  <span className="action-row__icon" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="action-row__content min-w-0">
                    <h3>{feature.title}</h3>
                    <p>{feature.body}</p>
                  </div>
                  <span className="action-row__link">
                    {feature.linkLabel}
                    <ArrowRight className="action-row__arrow h-4 w-4" aria-hidden />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Who is AGOS for */}
      <section
        id="audiences"
        aria-labelledby="who-is-agos-for-heading"
        className="fade-in-section section-white landing-section relative z-10 border-t border-[color:var(--border-subtle)]"
      >
        <div className="landing-section-inner">
          <h2
            id="who-is-agos-for-heading"
            className="landing-section-heading public-page-heading"
          >
            Who Is AGOS For?
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-body sm:text-base">
            AGOS is a planning and decision-support prototype. It supports
            exploration and discussion; it is not a real-time warning service and
            should be read alongside official advisories.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {audiences.map((audience) => {
              const Icon = audience.icon
              return (
                <article
                  key={audience.title}
                  className={`story-card interactive-card h-full ${audience.accentClass}`}
                >
                  <p className="audience-number" aria-hidden="true">
                    {audience.number}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="icon-badge">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="text-base font-semibold text-heading">
                      {audience.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-body sm:text-base">
                    {audience.body}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Feedback CTA */}
      <section
        id="feedback-cta"
        className="feedback-cta fade-in-section relative z-10"
        aria-labelledby="feedback-cta-heading"
      >
        <div className="feedback-cta__inner">
          <p className="feedback-cta__eyebrow">Feedback</p>
          <h2
            id="feedback-cta-heading"
            className="feedback-cta__heading public-page-heading font-display text-3xl font-semibold sm:text-4xl"
          >
            Help Us Improve AGOS
          </h2>
          <p className="feedback-cta__subtext">
            AGOS is a work in progress. Your input helps us refine how flood
            risk is visualized and prioritized.
          </p>
          <div className="feedback-cta__actions">
            <a
              href={feedbackLinks.user}
              className="feedback-cta-btn feedback-cta-btn--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Feedback as a User
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
            </a>
            <a
              href={feedbackLinks.expert}
              className="feedback-cta-btn feedback-cta-btn--outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Feedback as an Expert
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
            </a>
          </div>
        </div>
      </section>

      {/* Team credits */}
      <section
        id="team-credits"
        className="team-credits fade-in-section relative z-10 pb-12 md:pb-20 lg:pb-24"
        aria-labelledby="team-credits-heading"
      >
        <div className="team-credits__inner">
          <h2
            id="team-credits-heading"
            className="team-credits__heading public-page-heading font-display text-3xl font-semibold sm:text-4xl"
          >
            The Team Behind AGOS
          </h2>
          <p className="team-credits__intro">
            AGOS Manila is a thesis project developed by:
          </p>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <TeamMemberCard key={member.email} member={member} colorIndex={index} />
            ))}
          </div>
        </div>
      </section>

      <div className="fade-in-section public-footer-shell relative z-10">
        <PublicFooter />
      </div>
    </div>
  )
}
