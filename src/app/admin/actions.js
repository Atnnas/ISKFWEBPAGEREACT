'use server'

import dbConnect from '../../lib/mongodb';
import User from '../../models/User';
import Dojo from '../../models/Dojo';
import Kata from '../../models/Kata';
import { auth } from '../../auth';
import { unstable_cache, revalidateTag } from 'next/cache';

// Middleware simulado para proteger las acciones
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error("No autorizado: Se requiere rol de administrador");
  }
}

// ==========================================
// USUARIOS
// ==========================================

export async function getUsers() {
  await requireAdmin();
  await dbConnect();
  
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  
  return users.map(user => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString()
  }));
}

export async function updateUserRole(userId, newRole) {
  await requireAdmin();
  await dbConnect();
  
  if (!['visor', 'editor', 'admin'].includes(newRole)) {
    throw new Error("Rol inválido");
  }

  await User.findByIdAndUpdate(userId, { role: newRole });
  return { success: true };
}

export async function updateUserStatus(userId, isActive) {
  await requireAdmin();
  await dbConnect();
  
  await User.findByIdAndUpdate(userId, { isActive });
  return { success: true };
}

// ==========================================
// DOJOS
// ==========================================

export async function getDojosAdmin() {
  await requireAdmin();
  await dbConnect();
  
  const dojos = await Dojo.find({}).sort({ createdAt: -1 }).lean();
  
  return dojos.map(dojo => ({
    ...dojo,
    _id: dojo._id.toString(),
    createdAt: dojo.createdAt ? dojo.createdAt.toISOString() : null,
    updatedAt: dojo.updatedAt ? dojo.updatedAt.toISOString() : null,
  }));
}

export const getDojosPublic = unstable_cache(
  async () => {
    // Public function to get dojos for the frontend
    await dbConnect();
    
    const dojos = await Dojo.find({}).sort({ name: 1 }).lean();
    
    return dojos.map(dojo => ({
      ...dojo,
      _id: dojo._id.toString(),
      id: dojo.idName, // Map idName to id for backwards compatibility with the frontend components
      createdAt: dojo.createdAt ? dojo.createdAt.toISOString() : null,
      updatedAt: dojo.updatedAt ? dojo.updatedAt.toISOString() : null,
    }));
  },
  ['dojos-public-cache'],
  { tags: ['dojos-public'] }
);

export async function createDojo(dojoData) {
  await requireAdmin();
  await dbConnect();
  
  const newDojo = await Dojo.create(dojoData);
  revalidateTag('dojos-public');
  return { success: true, id: newDojo._id.toString() };
}

export async function updateDojo(dojoId, dojoData) {
  await requireAdmin();
  await dbConnect();
  
  await Dojo.findByIdAndUpdate(dojoId, dojoData);
  revalidateTag('dojos-public');
  return { success: true };
}

export async function deleteDojo(dojoId) {
  await requireAdmin();
  await dbConnect();
  
  await Dojo.findByIdAndDelete(dojoId);
  revalidateTag('dojos-public');
  return { success: true };
}

// ==========================================
// KATAS
// ==========================================

export const getKatasPublic = unstable_cache(
  async () => {
    await dbConnect();
    
    const katas = await Kata.find({}).lean();
    
    const categoriesMap = {
      'BÁSICAS ELEMENTALES': [],
      'INTERMEDIAS': [],
      'AVANZADAS': [],
      'SUPERIORES': []
    };
    
    katas.forEach(k => {
      if (categoriesMap[k.category]) {
        categoriesMap[k.category].push({
          id: k.idName,
          title: k.title,
          kanji: k.kanji,
          meaning: k.meaning,
          kanjiParts: k.kanjiParts || [],
          detailsHtml: k.detailsHtml || ''
        });
      }
    });

    const formattedData = Object.keys(categoriesMap).map(key => ({
      title: key,
      katas: categoriesMap[key]
    })).filter(cat => cat.katas.length > 0);
    
    return formattedData;
  },
  ['katas-public-cache'],
  { tags: ['katas-public'] }
);

export const getKataById = unstable_cache(
  async (id) => {
    await dbConnect();
    const kata = await Kata.findOne({ idName: id }).lean();
    
    if (!kata) return null;
    
    return {
      id: kata.idName,
      title: kata.title,
      kanji: kata.kanji,
      meaning: kata.meaning,
      category: kata.category,
      kanjiParts: kata.kanjiParts || [],
      detailsHtml: kata.detailsHtml || ''
    };
  },
  ['kata-detail-cache'],
  { tags: ['katas-public'] }
);

export async function createUser(userData) {
  await requireAdmin();
  await dbConnect();
  
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('El usuario con este correo ya existe');
  }

  const newUser = await User.create({
    name: userData.name || '',
    email: userData.email,
    role: userData.role || 'user',
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    image: '',
  });

  return { 
    id: newUser._id.toString(),
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    isActive: newUser.isActive,
    image: newUser.image,
    createdAt: newUser.createdAt?.toISOString() || new Date().toISOString()
  };
}

