"use server";

import { revalidatePath } from 'next/cache';
import dbConnect from '../mongodb';
import Entity from '../../models/Entity';

export async function getEntities() {
    try {
        await dbConnect();
        const entities = await Entity.find({}).sort({ name: 1 }).lean();
        
        return entities.map((entity: any) => ({
            ...entity,
            id: entity._id.toString(),
            _id: entity._id.toString(),
        }));
    } catch (error) {
        console.error('Error fetching entities:', error);
        return [];
    }
}

export async function createEntity(data: { name: string, logoUrl: string, flagUrl?: string }) {
    try {
        await dbConnect();
        const newEntity = new Entity(data);
        await newEntity.save();
        
        revalidatePath('/admin/entities');
        
        const plainEntity = newEntity.toObject();
        return { 
            success: true, 
            entity: {
                ...plainEntity,
                _id: plainEntity._id.toString(),
                id: plainEntity._id.toString()
            }
        };
    } catch (error: any) {
        console.error('Error creating entity:', error);
        return { success: false, error: error.message };
    }
}

export async function updateEntity(id: string, data: { name: string, logoUrl: string, flagUrl?: string }) {
    try {
        await dbConnect();
        
        const updatedEntity = await Entity.findByIdAndUpdate(id, data, { new: true }).lean();
        
        revalidatePath('/admin/entities');
        
        return { 
            success: true, 
            entity: {
                ...updatedEntity,
                _id: updatedEntity._id.toString(),
                id: updatedEntity._id.toString()
            }
        };
    } catch (error: any) {
        console.error('Error updating entity:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteEntity(id: string) {
    try {
        await dbConnect();
        await Entity.findByIdAndDelete(id);
        
        revalidatePath('/admin/entities');
        
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting entity:', error);
        return { success: false, error: error.message };
    }
}
