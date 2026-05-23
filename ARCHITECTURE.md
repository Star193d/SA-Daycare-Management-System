# SA Daycare Management System - Architecture

## Modular Architecture Diagram

```mermaid
graph TD
    UI[React Dashboard UI] --> RegMod(Registration Module)
    UI --> BillMod(Billing Module ZAR)
    UI --> AttMod(Attendance Module)
    UI --> MealMod(Meal Scheduling Module)
    UI --> CommMod(Parent Comms & Push Notifications)

    RegMod --> CoreData[(In-Memory/DB)]
    BillMod --> CoreData
    AttMod --> CoreData
    MealMod --> CoreData
    CommMod --> CoreData

    RegMod --> |Event: Child Registered| BillEvents
    
    subgraph Billing Engine
    BillEvents(Event Engine) --> |Triggers| InvGen(Invoice Generator)
    InvGen --> |1. Calculates Base ZAR| CalcBase
    InvGen --> |2. Applies Sibling Discount| CalcDisc
    InvGen --> |3. Calculates 15% VAT| CalcVat
    CalcVat --> Output(Tax Invoice INV-YYYY-MM-NNNN)
    end
    
    subgraph POPIA Compliance Layer
    Output --> Masking(SA ID Masking)
    CoreData --> Masking
    end
```

## Description
- **Registration**: Handles children, parents, and staff. Exposes grouping logic.
- **Billing**: Listens to registrations to auto-generate itemized tax invoices.
- **Compliance Layer**: Intercepts ID payloads on output paths to enforce `***-***-XXXX-X` masking.
