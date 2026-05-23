import React, { useState, useMemo } from 'react';
import { StateService } from '../lib/services/StateService';
import { MealPlan, Child } from '../lib/types';
import { Utensils, AlertTriangle, ShieldCheck, Plus, Check } from 'lucide-react';

interface MealsTabProps {
  stateService: StateService;
}

export const MealsTab: React.FC<MealsTabProps> = ({ stateService }) => {
  const [meals, setMeals] = useState<MealPlan[]>(stateService.meals);
  const [children, setChildren] = useState<Child[]>(stateService.children);

  // Form State to add/edit meal
  const [formMeal, setFormMeal] = useState({
    date: new Date().toISOString().split('T')[0],
    mealType: 'Lunch' as 'Breakfast' | 'Lunch' | 'Snack',
    description: '',
    allergens: ''
  });

  const [feedback, setFeedback] = useState<string>('');

  // SAs standard school weekly days (Mon - Fri)
  const currentWeekDays = useMemo(() => {
    // We show five days starting from the date of interest (or fixed May 18-22, 2026 for seed consistency, or select day)
    const baseDate = new Date(formMeal.date);
    const dayOfWeek = baseDate.getDay(); // 0 is Sunday, 1 is Monday ...
    const monday = new Date(baseDate);
    // Shift base to current Monday
    const diff = baseDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    monday.setDate(diff);

    const days: string[] = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day.toISOString().split('T')[0]);
    }
    return days;
  }, [formMeal.date]);

  // Cross-reference allergen hazards: maps meal ID to children names currently allergic
  const mealAllergenHazardsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    
    meals.forEach(meal => {
      const endangeredChildren: string[] = [];
      
      meal.allergens.forEach(allergen => {
        children.forEach(child => {
          // Case-insensitive allergy search
          const childAllergies = child.allergies.map(a => a.toLowerCase().trim());
          if (childAllergies.includes(allergen.toLowerCase().trim())) {
            endangeredChildren.push(`${child.firstName} ${child.lastName} (${child.groupId})`);
          }
        });
      });

      // Deduplicate names
      map[meal.id] = Array.from(new Set(endangeredChildren));
    });
    return map;
  }, [meals, children]);

  const handleSubmitMeal = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');

    if (!formMeal.description.trim()) {
      setFeedback('You must enter a description for the meal.');
      return;
    }

    const allergensArray = formMeal.allergens
      .split(',')
      .map(s => s.trim().charAt(0).toUpperCase() + s.trim().slice(1)) // uppercase first
      .filter(Boolean);

    const newMeal = stateService.addMeal({
      date: formMeal.date,
      mealType: formMeal.mealType,
      description: formMeal.description.trim(),
      allergens: allergensArray
    });

    setMeals([...stateService.meals]);
    stateService.logAction("Admin", "Schedule Meal", `Scheduled ${formMeal.mealType} on ${formMeal.date}: ${formMeal.description}`, newMeal.id, "Meal");
    setFeedback(`Success! Scheduled ${formMeal.mealType} with ${allergensArray.length} allergens flagged.`);
    setFormMeal(prev => ({ ...prev, description: '', allergens: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Visual Header Grid banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-xs text-emerald-800 flex gap-3 items-center">
        <ShieldCheck className="text-emerald-500 shrink-0" size={20} />
        <div>
          <h4 className="font-bold">Meal Hazard Protection Active</h4>
          <p className="mt-0.5 text-emerald-700">
            Our system scans diaper bag medical registries and parent profile notes to cross-reference primary ingredients with student profiles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly schedule layout browser */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slack-150 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-slate-800">Weekly Nutritional Menu Grid</h3>
              <span className="text-xxs text-slate-400 font-mono">May 2026 Scheduled Cycles</span>
            </div>

            <div className="p-6 space-y-6">
              {currentWeekDays.map(dateStr => {
                const dateObj = new Date(dateStr);
                const dayName = dateObj.toLocaleDateString('en-ZA', { weekday: 'long' });
                const dayMeals = meals.filter(m => m.date === dateStr);

                return (
                  <div key={dateStr} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {dayName} <span className="font-mono text-xs text-slate-400 font-semibold">({dateStr})</span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(['Breakfast', 'Lunch', 'Snack'] as const).map(type => {
                        const m = dayMeals.find(meal => meal.mealType === type);
                        const hazards = m ? (mealAllergenHazardsMap[m.id] || []) : [];

                        return (
                          <div key={type} className={`p-3.5 rounded-lg border text-xs flex flex-col justify-between h-32 ${
                            m ? (hazards.length > 0 ? 'bg-amber-50/50 border-amber-250 border-amber-200' : 'bg-slate-50 border-slate-200') : 'bg-slate-50/20 border-slate-150 border-dashed text-slate-400 justify-center items-center'
                          }`}>
                            {m ? (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-800 font-sans uppercase text-[9px] tracking-wider">{type}</span>
                                  {m.allergens.length > 0 && (
                                    <span className="bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded text-[8px] tracking-wide">
                                      {m.allergens.join(', ')}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] leading-snug font-medium text-slate-700">{m.description}</p>
                                
                                {hazards.length > 0 && (
                                  <div className="text-[9px] text-amber-800 flex items-start gap-1 font-semibold leading-relaxed">
                                    <AlertTriangle className="shrink-0 mt-0.5" size={12} />
                                    <span>Conflict: {hazards.join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-xxs text-slate-350">
                                <span className="italic">No {type} Scheduled</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Schedule input form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 h-fit space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Utensils size={15} /> Add/Edit Meal Item
          </h3>

          <form onSubmit={handleSubmitMeal} className="space-y-4">
            {feedback && (
              <div className="bg-slate-100 p-3 rounded-lg text-xxs font-semibold text-slate-700">
                {feedback}
              </div>
            )}

            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
              <input
                required
                type="date"
                value={formMeal.date}
                onChange={e => setFormMeal({ ...formMeal, date: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2.5 outline-none"
              />
            </div>

            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Meal Course Type</label>
              <select
                value={formMeal.mealType}
                onChange={e => setFormMeal({ ...formMeal, mealType: e.target.value as any })}
                className="w-full text-xs border border-slate-300 bg-white rounded-lg px-3 py-2.5 outline-none"
              >
                <option value="Breakfast">Breakfast Course</option>
                <option value="Lunch">Lunch Course</option>
                <option value="Snack">Snack Course</option>
              </select>
            </div>

            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Food Description</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Peanut Butter Sandwich and banana chunks"
                value={formMeal.description}
                onChange={e => setFormMeal({ ...formMeal, description: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Allergens Flagged (Comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Peanuts, Gluten"
                value={formMeal.allergens}
                onChange={e => setFormMeal({ ...formMeal, allergens: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-3 rounded-lg shadow-sm transition-all"
            >
              Post to Nutritional Calendar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
