export class Expense {
    constructor(fiscal: number, 
                category:number, 
                item:string, 
                subtotal: number, 
                paidTax: boolean) {
        this.fiscal = fiscal;
        this.category = category;
        this.item = item;
        this.subtotal = subtotal;
        this.paidTax = paidTax;
    }

    fiscal: number;
    category:number;
    item: string;
    subtotal: number;
    paidTax: boolean;
}