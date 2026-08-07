import { describe, expect, it } from 'vitest'

import { email, minLength, required, sameAs, validate } from './validation'

describe('required', () => {
  it('names the field it is missing', () => {
    expect(required('', 'Prénom')).toBe('Prénom est obligatoire.')
  })

  it('rejects a value made only of spaces', () => {
    expect(required('   ', 'Nom')).toBe('Nom est obligatoire.')
  })

  it('accepts a filled value', () => {
    expect(required('Jean', 'Prénom')).toBeNull()
  })

  it('reads an unchecked box as missing', () => {
    expect(required(false, 'Conditions')).toBe('Conditions est obligatoire.')
    expect(required(true, 'Conditions')).toBeNull()
  })
})

describe('email', () => {
  it('reports an empty address as missing rather than malformed', () => {
    expect(email('')).toBe('Adresse e-mail est obligatoire.')
  })

  it.each(['jean', 'jean@', 'jean@exemple', '@exemple.com', 'jean dupont@exemple.com'])(
    'rejects %s',
    (value) => {
      expect(email(value)).toBe('Cette adresse e-mail n’est pas valide.')
    },
  )

  it('accepts an ordinary address, spaces around it included', () => {
    expect(email('jean.dupont@exemple.com')).toBeNull()
    expect(email('  jean.dupont@exemple.com  ')).toBeNull()
  })
})

describe('minLength', () => {
  it('reports an empty value as missing, not too short', () => {
    expect(minLength('', 8, 'Mot de passe')).toBe('Mot de passe est obligatoire.')
  })

  it('states the length it wants', () => {
    expect(minLength('court', 8, 'Mot de passe')).toBe(
      'Mot de passe doit contenir au moins 8 caractères.',
    )
  })

  it('accepts a value at the boundary', () => {
    expect(minLength('12345678', 8, 'Mot de passe')).toBeNull()
  })
})

describe('sameAs', () => {
  it('rejects two different values', () => {
    expect(sameAs('a', 'b', 'Pas pareil.')).toBe('Pas pareil.')
  })

  it('accepts two identical values', () => {
    expect(sameAs('secret', 'secret', 'Pas pareil.')).toBeNull()
  })
})

describe('validate', () => {
  it('shapes its result like the API 422 body', () => {
    const errors = validate({
      email: () => email(''),
      password: () => required('', 'Mot de passe'),
    })

    expect(errors).toEqual({
      email: ['Adresse e-mail est obligatoire.'],
      password: ['Mot de passe est obligatoire.'],
    })
  })

  it('omits the fields that pass', () => {
    const errors = validate({
      email: () => email('jean@exemple.com'),
      password: () => required('', 'Mot de passe'),
    })

    expect(Object.keys(errors)).toEqual(['password'])
  })

  it('yields nothing when the whole form is valid', () => {
    expect(validate({ email: () => email('jean@exemple.com') })).toEqual({})
  })
})
