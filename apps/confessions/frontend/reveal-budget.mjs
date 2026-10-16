export class RevealBudget{
 constructor(saved){this.ids=new Set(Array.isArray(saved?.ids)?saved.ids.filter(id=>typeof id==='string').slice(-500):[]);this.remaining=Number.isInteger(saved?.remaining)&&saved.remaining>=0&&saved.remaining<=5?saved.remaining:5;}
 needsAd(id){return !this.ids.has(id)&&this.remaining===0;}
 grant(){this.remaining=5;}
 use(id){if(this.ids.has(id))return;if(this.remaining<=0)throw Error('Unlock your next five reveals first.');this.remaining--;this.ids.add(id);if(this.ids.size>500)this.ids.delete(this.ids.values().next().value);}
 snapshot(){return {ids:[...this.ids],remaining:this.remaining};}
}
