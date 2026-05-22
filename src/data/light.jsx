import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import { initSpectrumWidget } from '../widgets/light/legacy/spectrum.js';
import { initReflectionWidget } from '../widgets/light/legacy/reflection.js';
import { initRefractionWidget } from '../widgets/light/legacy/refraction.js';
import { initLensesWidget } from '../widgets/light/legacy/lenses.js';
import { initDiffractionWidget } from '../widgets/light/legacy/diffraction.js';
import { initPolarizationWidget } from '../widgets/light/legacy/polarization.js';
import { initColorWidget } from '../widgets/light/legacy/color.js';
import { initPhotonsWidget } from '../widgets/light/legacy/photons.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'light',
  title: 'Light',
  intro: <>Eight lessons on the physics of light through interactive optics experiments — the spectrum, reflection, refraction, lenses, diffraction, polarization, color perception, and wave-particle duality.</>,
  lessons: [
    { slug: 'spectrum', number: '01', title: 'The Spectrum', blurb: 'Light is electromagnetic waves. Visible is a tiny slice.', Widget: W(initSpectrumWidget),
      intro: <>Radio, microwave, infrared, visible, UV, X-ray, gamma — all the same thing at different wavelengths. The visible band is just where our eyes evolved sensitivity.</>, sections: [],
      takeaways: ['Wavelength × frequency = speed of light. Always.', 'Visible: ~400–700 nm. Below 400 = UV; above 700 = IR.', 'Higher frequency = higher energy per photon = more damaging.', 'Atmospheric windows decide which bands reach the ground.'] },
    { slug: 'reflection', number: '02', title: 'Reflection', blurb: 'Angle in, angle out.', Widget: W(initReflectionWidget),
      intro: <>The angle of incidence equals the angle of reflection — measured from the surface normal. Polished surfaces preserve image; rough surfaces scatter.</>, sections: [],
      takeaways: ['Law of reflection: θᵢ = θᵣ, measured from normal.', 'Specular vs diffuse — same rule, different surface roughness.', 'Mirrors are flat metalized glass. Curved mirrors focus.', 'Polarization changes on reflection (Fresnel equations).'] },
    { slug: 'refraction', number: '03', title: 'Refraction', blurb: "Light bends when it changes medium. Snell's law in slow motion.", Widget: W(initRefractionWidget),
      intro: <>When light crosses from one medium to another, it speeds up or slows down, bending at the interface. Snell\'s law captures the geometry.</>, sections: [],
      takeaways: ['n₁ sin θ₁ = n₂ sin θ₂. Snell\'s law.', 'Refractive index = c / phase speed in the medium.', 'Total internal reflection above the critical angle — basis of fiber optics.', 'Prisms split because n depends on wavelength (dispersion).'] },
    { slug: 'lenses', number: '04', title: 'Lenses & Imaging', blurb: 'How a curved piece of glass focuses rays.', Widget: W(initLensesWidget),
      intro: <>A lens is shaped so parallel rays converge at the focal point. Everything in cameras, microscopes, telescopes is built from this.</>, sections: [],
      takeaways: ['Thin-lens equation: 1/u + 1/v = 1/f.', 'Converging (convex) lenses focus; diverging (concave) lenses spread.', 'Spherical aberration: rays from the edge focus closer than from the center.', 'Modern lenses stack 10+ elements to correct aberrations.'] },
    { slug: 'diffraction', number: '05', title: 'Diffraction & Interference', blurb: 'Light is a wave — it spreads through slits and overlaps.', Widget: W(initDiffractionWidget),
      intro: <>Send light through a narrow slit and it spreads. Send through two slits and the spread patterns overlap, producing bright and dark bands — the classic interference pattern.</>, sections: [],
      takeaways: ['Wave behavior emerges when slit ~ wavelength.', 'Double slit produces sinusoidal intensity pattern.', 'Diffraction limit: the smallest detail any lens can resolve.', 'CD/DVD rainbows are diffraction off the data tracks.'] },
    { slug: 'polarization', number: '06', title: 'Polarization', blurb: 'Light waves oscillate in a direction.', Widget: W(initPolarizationWidget),
      intro: <>Light is a transverse wave — its E-field oscillates perpendicular to the direction of travel. Polarizers transmit only one orientation.</>, sections: [],
      takeaways: ['Unpolarized light: random orientations. Polarized: aligned.', 'Crossed polarizers (90°) block all light.', "Malus's law: intensity = cos²(angle between).", 'LCDs work by twisting polarization between polarizers.'] },
    { slug: 'color', number: '07', title: 'Color & Perception', blurb: 'Wavelength is physical. Color is what your brain does with it.', Widget: W(initColorWidget),
      intro: <>Your eye has three cone types — red, green, blue. Color is the brain\'s interpretation of their relative responses, not a property of light itself.</>, sections: [],
      takeaways: ['RGB additive: screens combine colored emitters. Black = none, white = all.', 'CMY subtractive: pigments absorb certain wavelengths. White = none, black = all.', 'Metamers: different spectra that look the same.', "Magenta isn't on the spectrum — the brain invents it to wrap red and violet."] },
    { slug: 'photons', number: '08', title: 'Wave-Particle Duality', blurb: 'Light is also discrete photons.', Widget: W(initPhotonsWidget),
      intro: <>Send light one photon at a time through a double slit. The pattern still appears — each photon interferes with itself. Wave and particle, simultaneously.</>, sections: [],
      takeaways: ['Photon energy E = hν. Quantized — you can\'t have half a photon.', 'Photoelectric effect: above a frequency threshold, light kicks out electrons. Won the 1921 Nobel.', 'Compton scattering: photons collide with electrons like particles.', "Whether you see a wave or a particle depends on what you measure — there's no \"underneath\"."] },
  ],
};
