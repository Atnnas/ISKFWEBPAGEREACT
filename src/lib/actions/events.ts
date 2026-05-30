"use server";

import { revalidatePath } from 'next/cache';
import dbConnect from '../mongodb';
import Event from '../../models/Event';

import Entity from '../../models/Entity';
import Dojo from '../../models/Dojo';

export async function getEvents() {
    try {
        await dbConnect();
        const events = await Event.find({}).sort({ startDate: 1 }).lean();
        
        // Convert _id to id and stringify dates for serialization
        return events.map((event: any) => ({
            ...event,
            id: event._id.toString(),
            _id: event._id.toString(),
            startDate: event.startDate.toISOString(),
            endDate: event.endDate.toISOString(),
        }));
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

export async function getEventById(id: string) {
    try {
        await dbConnect();
        const event = await Event.findById(id).lean();
        if (!event) return null;
        
        return {
            ...event,
            id: event._id.toString(),
            _id: event._id.toString(),
            startDate: event.startDate.toISOString(),
            endDate: event.endDate.toISOString(),
        };
    } catch (error) {
        console.error('Error fetching event by id:', error);
        return null;
    }
}

async function getOrganizerDetails(organizerName: string) {
    // First try entity
    const entity = await Entity.findOne({ name: organizerName });
    if (entity) {
        return {
            logoUrl: entity.logoUrl || '/images/dojos/default_logo.jpg',
            flagUrl: entity.flagUrl || 'costaRicaFlag'
        };
    }
    // Then try dojo
    const dojo = await Dojo.findOne({ name: organizerName });
    if (dojo) {
        return {
            logoUrl: dojo.logo || '/images/dojos/default_logo.jpg',
            flagUrl: 'costaRicaFlag'
        };
    }
    // Default fallback
    return {
        logoUrl: '/images/dojos/default_logo.jpg',
        flagUrl: 'costaRicaFlag'
    };
}

export async function createEvent(formData: FormData) {
    try {
        await dbConnect();
        
        const title = formData.get('title') as string;
        const startDate = new Date(formData.get('startDate') as string);
        const endDate = new Date(formData.get('endDate') as string);
        const type = formData.get('type') as string;
        const locationScope = formData.get('locationScope') as string;
        const organizer = formData.get('organizer') as string;
        const location = formData.get('location') as string;
        const color = locationScope === 'Internacional' ? 'bg-iskf-blue' : 'bg-iskf-red';

        // Ensure endDate is at least the same as startDate
        if (endDate < startDate) {
            endDate.setTime(startDate.getTime());
        }

        const { logoUrl, flagUrl } = await getOrganizerDetails(organizer);
        const flagName = formData.get('flagName') as string || flagUrl;

        const newEvent = new Event({
            title,
            startDate,
            endDate,
            type,
            locationScope,
            organizer,
            logoName: logoUrl,
            flagName,
            location,
            color
        });

        await newEvent.save();
        revalidatePath('/admin/events');
        revalidatePath('/calendario');
        
        return { success: true };
    } catch (error: any) {
        console.error('Error creating event:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteEvent(id: string) {
    try {
        await dbConnect();
        await Event.findByIdAndDelete(id);
        
        revalidatePath('/admin/events');
        revalidatePath('/calendario');
        
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting event:', error);
        return { success: false, error: error.message };
    }
}

export async function updateEvent(id: string, formData: FormData) {
    try {
        await dbConnect();
        
        const title = formData.get('title') as string;
        const startDate = new Date(formData.get('startDate') as string);
        const endDate = new Date(formData.get('endDate') as string);
        const type = formData.get('type') as string;
        const locationScope = formData.get('locationScope') as string;
        const organizer = formData.get('organizer') as string;
        const location = formData.get('location') as string;
        const color = locationScope === 'Internacional' ? 'bg-iskf-blue' : 'bg-iskf-red';

        if (endDate < startDate) {
            endDate.setTime(startDate.getTime());
        }

        const { logoUrl, flagUrl } = await getOrganizerDetails(organizer);
        const flagName = formData.get('flagName') as string || flagUrl;

        await Event.findByIdAndUpdate(id, {
            title,
            startDate,
            endDate,
            type,
            locationScope,
            organizer,
            logoName: logoUrl,
            flagName,
            location,
            color
        });

        revalidatePath('/admin/events');
        revalidatePath('/calendario');
        
        return { success: true };
    } catch (error: any) {
        console.error('Error updating event:', error);
        return { success: false, error: error.message };
    }
}
