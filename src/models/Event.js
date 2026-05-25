import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'El título es requerido'],
            trim: true,
        },
        startDate: {
            type: Date,
            required: [true, 'La fecha de inicio es requerida'],
        },
        endDate: {
            type: Date,
            required: [true, 'La fecha de fin es requerida'],
        },
        type: {
            type: String,
            enum: ['Torneo', 'Seminario', 'Examen', 'Campamento', 'Otro'],
            default: 'Torneo',
        },
        locationScope: {
            type: String,
            enum: ['Nacional', 'Internacional'],
            default: 'Nacional',
        },
        organizer: {
            type: String,
            default: 'ISKF Costa Rica'
        },
        location: {
            type: String,
            trim: true,
        },
        color: {
            type: String,
            default: 'bg-iskf-red',
        },
        description: {
            type: String,
        },
        logoName: {
            type: String,
        },
        flagName: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

// Delete existing model to avoid OverwriteModelError in Next.js during hot-reloads
if (mongoose.models.Event) {
    delete mongoose.models.Event;
}
const Event = mongoose.model('Event', EventSchema);

export default Event;
